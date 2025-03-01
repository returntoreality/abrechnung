from typing import Any, Mapping, Optional

from marshmallow import Schema, fields, post_load

from abrechnung.domain.transactions import TransactionPosition


class GroupSchema(Schema):
    id = fields.Int()
    name = fields.Str()
    description = fields.Str()
    currency_symbol = fields.Str()
    terms = fields.Str()
    add_user_account_on_join = fields.Bool()
    created_by = fields.Int()
    created_at = fields.DateTime()


class GroupPreviewSchema(Schema):
    id = fields.Int()
    name = fields.Str()
    description = fields.Str()
    currency_symbol = fields.Str()
    terms = fields.Str()
    created_at = fields.DateTime()
    invite_single_use = fields.Bool()
    invite_valid_until = fields.DateTime()
    invite_description = fields.Str()


class GroupInviteSchema(Schema):
    id = fields.Int()
    created_by = fields.Int()
    single_use = fields.Bool()
    valid_until = fields.DateTime()
    token = fields.Str()
    description = fields.Str()
    join_as_editor = fields.Bool()


class GroupLogSchema(Schema):
    id = fields.Int()
    type = fields.Str()
    message = fields.Str()
    user_id = fields.Int()
    logged_at = fields.DateTime()
    affected_user_id = fields.Int()


class SharesField(fields.Field):
    def _serialize(
        self, value: Mapping[int, float], attr: Optional[str], obj: Any, **kwargs
    ):
        return {
            str(account_id): usage_value for account_id, usage_value in value.items()
        }

    def _deserialize(
        self,
        value: Any,
        attr: Optional[str],
        data: Optional[Mapping[str, Any]],
        **kwargs,
    ):
        if not isinstance(value, dict):
            raise fields.ValidationError(message="expected a dictionary")
        try:
            return {int(k): float(v) for k, v in value.items()}
        except:
            raise fields.ValidationError(
                message="expected a dictionary mapping int to float"
            )


class AccountDetailSchema(Schema):
    name = fields.Str()
    description = fields.Str()
    priority = fields.Int()
    owning_user_id = fields.Int(allow_none=True)
    revision_started_at = fields.DateTime()
    revision_committed_at = fields.DateTime(required=False)
    clearing_shares = SharesField()
    deleted = fields.Bool()


class AccountSchema(Schema):
    id = fields.Int()
    type = fields.Str()
    is_wip = fields.Bool()
    last_changed = fields.DateTime()
    group_id = fields.Int()
    version = fields.Int()
    pending_details = fields.Nested(AccountDetailSchema, allow_none=True)
    committed_details = fields.Nested(AccountDetailSchema, allow_none=True)


class TransactionPositionSchema(Schema):
    id = fields.Int()
    price = fields.Number()
    communist_shares = fields.Number()
    deleted = fields.Bool(required=False, load_default=False)
    name = fields.Str()
    usages = SharesField(load_default={})

    @post_load
    def make_position(self, data, **kwargs):
        return TransactionPosition(**data)


class TransactionDetailSchema(Schema):
    description = fields.Str()
    value = fields.Number()
    currency_symbol = fields.Str()
    currency_conversion_rate = fields.Number()
    billed_at = fields.Date()
    revision_started_at = fields.DateTime()
    revision_committed_at = fields.DateTime(required=False)
    creditor_shares = SharesField()
    debitor_shares = SharesField()
    deleted = fields.Bool()


class FileAttachmentSchema(Schema):
    id = fields.Int()
    filename = fields.Method("get_filename")
    blob_id = fields.Int(allow_none=True)
    deleted = fields.Bool()
    url = fields.Method("get_url")

    def get_filename(self, obj):
        return (
            obj.filename + ("." + obj.mime_type.split("/")[1]) if obj.mime_type else ""
        )

    def get_url(self, obj):
        return f"{obj.host_url}/v1/files/{obj.id}/{obj.blob_id}"


class TransactionSchema(Schema):
    id = fields.Int()
    type = fields.Str()
    is_wip = fields.Bool()
    last_changed = fields.DateTime()
    group_id = fields.Int()
    version = fields.Int()
    pending_details = fields.Nested(TransactionDetailSchema, allow_none=True)
    committed_details = fields.Nested(TransactionDetailSchema, allow_none=True)
    pending_positions = fields.List(
        fields.Nested(TransactionPositionSchema), dump_default=[]
    )
    committed_positions = fields.List(
        fields.Nested(TransactionPositionSchema), dump_default=[]
    )
    pending_files = fields.List(fields.Nested(FileAttachmentSchema), dump_default=[])
    committed_files = fields.List(fields.Nested(FileAttachmentSchema), dump_default=[])


class SessionSchema(Schema):
    id = fields.Int()
    name = fields.Str()
    valid_until = fields.DateTime()
    last_seen = fields.DateTime()


class UserSchema(Schema):
    id = fields.Int()
    username = fields.Str()
    email = fields.Email()
    is_guest_user = fields.Bool()
    registered_at = fields.DateTime()
    sessions = fields.List(fields.Nested(SessionSchema))


class GroupMemberSchema(Schema):
    user_id = fields.Int()
    username = fields.Str()
    is_owner = fields.Bool()
    can_write = fields.Bool()
    description = fields.Str()
    joined_at = fields.DateTime()
    invited_by = fields.Int()
