import axios from "axios";
import { DateTime } from "luxon";

export const siteHost =
    !process.env.NODE_ENV || process.env.NODE_ENV === "development"
        ? `${window.location.hostname}:8080`
        : window.location.host;
export const baseURL = `${window.location.protocol}//${siteHost}`;
console.log("API Base URL", baseURL);

export const fetchToken = () => {
    const token = localStorage.getItem("access_token");
    if (token == null || String(token) === "null" || String(token) === "undefined") {
        return null;
    }
    try {
        const payload = token.split(".")[1];
        const { exp: expires } = JSON.parse(atob(payload));
        if (typeof expires === "number" && DateTime.fromSeconds(expires) > DateTime.now()) {
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            return token;
        }
    } catch {
        removeToken();
        return null;
    }

    return null;
};

export const getTokenJSON = () => {
    const token = fetchToken();
    if (token == null) {
        return null;
    }

    return JSON.parse(atob(token.split(".")[1]));
};

export const getUserIDFromToken = () => {
    const token = getTokenJSON();
    if (token === null) {
        return null;
    }

    const { user_id: userID } = token;
    return userID;
};

const api = axios.create({
    baseURL: `${baseURL}/api/v1`,
});
const bareApi = axios.create({
    baseURL: `${baseURL}/api/v1`,
});

axios.defaults.headers.common["Content-Type"] = "application/json";
bareApi.defaults.headers.common["Content-Type"] = "application/json";

const errorInterceptor = (error) => {
    if (
        error.hasOwnProperty("response") &&
        error.response.hasOwnProperty("data") &&
        error.response.data.hasOwnProperty("msg")
    ) {
        return Promise.reject(error.response.data.msg);
    }
    return Promise.reject(error);
};

bareApi.interceptors.response.use((response) => response, errorInterceptor);
api.interceptors.response.use((response) => response, errorInterceptor);
api.defaults.headers.common["Content-Type"] = "application/json";

export function setAccessToken(token) {
    localStorage.setItem("access_token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export function setToken(token, sessionToken) {
    localStorage.setItem("session_token", sessionToken);
    setAccessToken(token);
}

export function removeToken() {
    console.log("deleting access token from local storage ...");
    localStorage.removeItem("access_token");
    localStorage.removeItem("session_token");
}

export async function fetchAccessToken(sessionToken) {
    const resp = await bareApi.post("/auth/fetch_access_token", {
        token: sessionToken,
    });
    setAccessToken(resp.data.access_token);
    return resp.data;
}

export async function refreshToken() {
    const token = localStorage.getItem("access_token");
    if (
        token == null ||
        String(token) === "null" ||
        String(token) === "undefined" ||
        DateTime.fromSeconds(JSON.parse(atob(token.split(".")[1])).exp) <= DateTime.now().plus({ minutes: 1 })
    ) {
        const sessionToken = localStorage.getItem("session_token");
        if (sessionToken == null) {
            return Promise.reject("cannot refresh access token");
        }
        const resp = await bareApi.post("/auth/fetch_access_token", {
            token: sessionToken,
        });
        setAccessToken(resp.data.access_token);
    }
}

async function makePost(url, data = null, options = null) {
    await refreshToken();
    return await api.post(url, data, options);
}

async function makeGet(url, options = null) {
    await refreshToken();
    return await api.get(url, options);
}

async function makeDelete(url, data = null) {
    await refreshToken();
    return await api.delete(url, { data: data });
}

export async function login({ username, password }) {
    const sessionName = navigator.appVersion + " " + navigator.userAgent + " " + navigator.appName;
    const resp = await bareApi.post("/auth/login", {
        username: username,
        password: password,
        session_name: sessionName,
    });
    setToken(resp.data.access_token, resp.data.session_token);
    return resp.data;
}

export async function logout() {
    try {
        await makePost("/auth/logout");
    } catch {
        // do nothing
    }
    removeToken();
}

export async function register({ username, email, password, inviteToken }) {
    const resp = await bareApi.post("/auth/register", {
        username: username,
        email: email,
        password: password,
        invite_token: inviteToken,
    });
    return resp.data;
}

export async function fetchProfile() {
    const resp = await makeGet("/profile");
    return resp.data;
}

export async function deleteSession({ sessionID }) {
    const resp = await makePost("/auth/delete_session", {
        session_id: sessionID,
    });
    return resp.data;
}

export async function renameSession({ sessionID, name }) {
    const resp = await makePost("/auth/rename_session", {
        session_id: sessionID,
        name: name,
    });
    return resp.data;
}

export async function requestPasswordRecovery({ email }) {
    const resp = await makePost("/auth/recover_password", { email: email });
    return resp.data;
}

export async function confirmPasswordRecovery({ token, newPassword }) {
    const resp = await makePost("/auth/confirm_password_recovery", {
        token: token,
        new_password: newPassword,
    });
    return resp.data;
}

export async function changeEmail({ password, newEmail }) {
    const resp = await makePost("/profile/change_email", {
        password: password,
        email: newEmail,
    });
    return resp.data;
}

export async function changePassword({ oldPassword, newPassword }) {
    const resp = await makePost("/profile/change_password", {
        old_password: oldPassword,
        new_password: newPassword,
    });
    return resp.data;
}

export async function confirmRegistration({ token }) {
    const resp = await bareApi.post("/auth/confirm_registration", {
        token: token,
    });
    return resp.data;
}

export async function confirmEmailChange({ token }) {
    const resp = await bareApi.post("/auth/confirm_email_change", {
        token: token,
    });
    return resp.data;
}

export async function confirmPasswordReset({ token }) {
    const resp = await bareApi.post("/auth/confirm_password_reset", {
        token: token,
    });
    return resp.data;
}

export async function fetchGroups() {
    const resp = await makeGet("/groups");
    return resp.data;
}

export async function fetchGroup(groupID) {
    const resp = await makeGet(`/groups/${groupID}`);
    return resp.data;
}

export async function createGroup({
    name,
    description,
    currencySymbol = "€",
    terms = "",
    addUserAccountOnJoin = false,
}) {
    const resp = await makePost("/groups", {
        name: name,
        description: description,
        currency_symbol: currencySymbol,
        terms: terms,
        add_user_account_on_join: addUserAccountOnJoin,
    });
    return resp.data;
}

export async function updateGroupMetadata({ groupID, name, description, currencySymbol, terms, addUserAccountOnJoin }) {
    const resp = await makePost(`/groups/${groupID}`, {
        name: name,
        description: description,
        currency_symbol: currencySymbol,
        terms: terms,
        add_user_account_on_join: addUserAccountOnJoin,
    });
    return resp.data;
}

export async function leaveGroup({ groupID }) {
    const resp = await makePost(`/groups/${groupID}/leave`);
    return resp.data;
}

export async function deleteGroup({ groupID }) {
    const resp = await makeDelete(`/groups/${groupID}`);
    return resp.data;
}

export async function updateGroupMemberPrivileges({ groupID, userID, isOwner, canWrite }) {
    const resp = await makePost(`/groups/${groupID}/members`, {
        user_id: userID,
        is_owner: isOwner,
        can_write: canWrite,
    });
    return resp.data;
}

export async function fetchGroupPreview({ token }) {
    const resp = await makePost(`/groups/preview`, {
        invite_token: token,
    });
    return resp.data;
}

export async function joinGroup({ token }) {
    const resp = await makePost(`/groups/join`, {
        invite_token: token,
    });
    return resp.data;
}

export async function fetchInvites({ groupID }) {
    const resp = await makeGet(`/groups/${groupID}/invites`);
    return resp.data;
}

export async function createGroupInvite({ groupID, description, validUntil, singleUse, joinAsEditor }) {
    const resp = await makePost(`/groups/${groupID}/invites`, {
        description: description,
        valid_until: validUntil,
        single_use: singleUse,
        join_as_editor: joinAsEditor,
    });
    return resp.data;
}

export async function deleteGroupInvite({ groupID, inviteID }) {
    const resp = await makeDelete(`/groups/${groupID}/invites/${inviteID}`);
    return resp.data;
}

export async function fetchMembers({ groupID }) {
    const resp = await makeGet(`/groups/${groupID}/members`);
    return resp.data;
}

export async function fetchLog({ groupID }) {
    const resp = await makeGet(`/groups/${groupID}/logs`);
    return resp.data;
}

export async function sendGroupMessage({ groupID, message }) {
    const resp = await makePost(`/groups/${groupID}/send_message`, {
        message: message,
    });
    return resp.data;
}

export async function fetchAccounts({ groupID }) {
    const resp = await makeGet(`/groups/${groupID}/accounts`);
    return resp.data;
}

export async function fetchAccount({ accountID }) {
    const resp = await makeGet(`/accounts/${accountID}`);
    return resp.data;
}

export async function createAccount({
    groupID,
    name,
    description,
    owningUserID = null,
    accountType = "personal",
    clearingShares = null,
}) {
    const resp = await makePost(`/groups/${groupID}/accounts`, {
        name: name,
        description: description,
        owning_user_id: owningUserID,
        type: accountType,
        clearing_shares: clearingShares,
    });
    return resp.data;
}

export async function updateAccountDetails({
    accountID,
    name,
    description,
    owningUserID = null,
    clearingShares = null,
}) {
    const resp = await makePost(`/accounts/${accountID}`, {
        name: name,
        description: description,
        owning_user_id: owningUserID,
        clearing_shares: clearingShares,
    });
    return resp.data;
}

export async function deleteAccount({ accountID }) {
    const resp = await makeDelete(`/accounts/${accountID}`);
    return resp.data;
}

export async function fetchTransactions({ groupID, minLastChanged = null, additionalTransactions = null }) {
    let url = `/groups/${groupID}/transactions`;
    if (minLastChanged) {
        url += "?min_last_changed=" + encodeURIComponent(minLastChanged.toISO());
        if (additionalTransactions && additionalTransactions.length > 0) {
            url += "&transaction_ids=" + additionalTransactions.join(",");
        }
    }
    const resp = await makeGet(url);
    return resp.data;
}

export async function fetchTransaction({ transactionID }) {
    const resp = await makeGet(`/transactions/${transactionID}`);
    return resp.data;
}

export async function createTransaction({
    groupID,
    type,
    description,
    value,
    billedAt,
    currencySymbol = "€",
    currencyConversionRate = 1.0,
    creditorShares = undefined,
    debitorShares = undefined,
    performCommit = false,
}) {
    const resp = await makePost(`/groups/${groupID}/transactions`, {
        description: description,
        value: value,
        type: type,
        billed_at: billedAt,
        currency_symbol: currencySymbol,
        currency_conversion_rate: currencyConversionRate,
        creditor_shares: creditorShares,
        debitor_shares: debitorShares,
        perform_commit: performCommit,
    });
    return resp.data;
}

export async function updateTransaction({
    transactionID,
    description,
    value,
    billedAt,
    currencySymbol,
    currencyConversionRate,
    creditorShares = null,
    debitorShares = null,
    positions = null,
    performCommit = true,
}) {
    let payload = {
        description: description,
        value: value,
        billed_at: billedAt.toISODate(),
        currency_symbol: currencySymbol,
        currency_conversion_rate: currencyConversionRate,
        perform_commit: performCommit,
        creditor_shares: creditorShares ? creditorShares : undefined,
        debitor_shares: debitorShares ? debitorShares : undefined,
        positions: positions
            ? positions.map((p) => {
                  return {
                      ...p,
                      only_local: undefined,
                  };
              })
            : undefined,
    };
    const resp = await makePost(`/transactions/${transactionID}`, payload);
    return resp.data;
}

export async function updateTransactionPositions({ transactionID, positions, performCommit = true }) {
    let payload = {
        perform_commit: performCommit,
        positions: positions.map((p) => {
            return {
                ...p,
                only_local: undefined,
            };
        }),
    };
    const resp = await makePost(`/transactions/${transactionID}/positions`, payload);
    return resp.data;
}

export async function uploadFile({ transactionID, filename, file, onUploadProgress }) {
    let formData = new FormData();

    formData.append("file", file);
    formData.append("filename", filename);

    const resp = await makePost(`/transactions/${transactionID}/files`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
    });
    return resp.data;
}

export async function fetchFile({ fileID, blobID }) {
    return makeGet(`/files/${fileID}/${blobID}`, {
        responseType: "blob",
    });
}

export async function deleteFile({ fileID }) {
    const resp = await makeDelete(`/files/${fileID}`);
    return resp.data;
}

export async function commitTransaction({ transactionID }) {
    const resp = await makePost(`/transactions/${transactionID}/commit`);
    return resp.data;
}

export async function createTransactionChange({ transactionID }) {
    const resp = await makePost(`/transactions/${transactionID}/new_change`);
    return resp.data;
}

export async function discardTransactionChange({ transactionID }) {
    const resp = await makePost(`/transactions/${transactionID}/discard`);
    return resp.data;
}

export async function deleteTransaction({ transactionID }) {
    const resp = await makeDelete(`/transactions/${transactionID}`);
    return resp.data;
}
