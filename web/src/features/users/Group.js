import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

import Row from "react-bootstrap/cjs/Row";
import Col from "react-bootstrap/cjs/Col";
import Spinner from "react-bootstrap/Spinner";
import "react-datetime/css/react-datetime.css";
import InviteLinkList from "./InviteLinkList";

import { fetchGroups } from "./usersSlice";
import GroupMemberList from "./GroupMemberList";
import Tab from "react-bootstrap/Tab";
import ListGroup from "react-bootstrap/cjs/ListGroup";
import { LinkContainer } from "react-router-bootstrap";
import GroupLog from "./GroupLog";
import GroupDetail from "./GroupDetail";

class Group extends Component {
    state = {};

    componentDidMount = () => {
        if (this.props.groups === null) {
            this.props.fetchGroups();
        }
    };

    getGroup = () => {
        // we need parseInt here since the props param is a string
        return this.props.groups === null
            ? null
            : this.props.groups.find((group) => group.id === parseInt(this.props.match.params.id));
    };

    render() {
        const error = this.props.error !== null ? <div className="alert alert-danger">{this.props.error}</div> : "";
        const group = this.getGroup();

        if (group === null) {
            return (
                <Row>
                    <Col xs={12}>
                        <div className={"d-flex justify-content-center"}>
                            <Spinner animation="border" role="status">
                                <span className="sr-only">Loading...</span>
                            </Spinner>
                        </div>
                    </Col>
                </Row>
            );
        }

        return (
            <Row>
                <Col xs={12}>
                    <h3>{group.name}</h3>
                    {error}
                    <hr />
                    <Tab.Container
                        id="group-tabs"
                        defaultActiveKey="group-detail"
                        activeKey={this.props.match.params !== undefined ? this.props.match.params.tab : "group-detail"}
                    >
                        <Row>
                            <Col lg={3} md={4}>
                                <ListGroup>
                                    <LinkContainer to={"/groups/" + this.props.match.params.id + "/group-detail"}>
                                        <ListGroup.Item action>Group Detail</ListGroup.Item>
                                    </LinkContainer>
                                    <LinkContainer to={"/groups/" + this.props.match.params.id + "/members"}>
                                        <ListGroup.Item action>Members</ListGroup.Item>
                                    </LinkContainer>
                                    <LinkContainer to={"/groups/" + this.props.match.params.id + "/chat"}>
                                        <ListGroup.Item action>Chat</ListGroup.Item>
                                    </LinkContainer>
                                    <LinkContainer to={"/groups/" + this.props.match.params.id + "/invite-tokens"}>
                                        <ListGroup.Item action>Invite Links</ListGroup.Item>
                                    </LinkContainer>
                                </ListGroup>
                            </Col>
                            <Col lg={9} md={8}>
                                <Tab.Content>
                                    <Tab.Pane eventKey="group-detail">
                                        <GroupDetail group={group} />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="members">
                                        <GroupMemberList group={group} />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="chat">
                                        <GroupLog group={group} />
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="invite-tokens">
                                        <InviteLinkList group={group} />
                                    </Tab.Pane>
                                </Tab.Content>
                            </Col>
                        </Row>
                    </Tab.Container>
                </Col>
            </Row>
        );
    }
}

const mapStateToProps = (state) => ({
    status: state.users.status,
    error: state.users.error,
    groups: state.users.groups,
});

export default withRouter(connect(mapStateToProps, { fetchGroups })(Group));
