import { IssueDescription } from './value-objects/issue-description.js';
import { IssuePriority } from './value-objects/issue-priority.js';
import { IssueStatus } from './value-objects/issue-status.js';
import { IssueTitle } from './value-objects/issue-title.js';
import { IssueType } from './value-objects/issue-type.js';

const keep = (next, current) => (next === undefined ? current : next);

export class Issue {
  #id;
  #projectId;
  #number;
  #title;
  #type;
  #status;
  #priority;
  #listPosition;
  #description;
  #estimate;
  #timeSpent;
  #timeRemaining;
  #reporterId;
  #assigneeIds;
  #createdAt;
  #updatedAt;

  constructor(props) {
    this.#id = props.id;
    this.#projectId = props.projectId;
    this.#number = props.number;
    this.#title = props.title;
    this.#type = props.type;
    this.#status = props.status;
    this.#priority = props.priority;
    this.#listPosition = props.listPosition;
    this.#description = props.description;
    this.#estimate = props.estimate;
    this.#timeSpent = props.timeSpent;
    this.#timeRemaining = props.timeRemaining;
    this.#reporterId = props.reporterId;
    this.#assigneeIds = props.assigneeIds;
    this.#createdAt = props.createdAt;
    this.#updatedAt = props.updatedAt;
  }

  static create({ now = new Date(), assigneeIds = [], ...props }) {
    const timestamp = now.toISOString();
    return new Issue({
      ...props,
      number: null,
      assigneeIds: [...new Set(assigneeIds)],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static restore(snapshot) {
    return new Issue({
      id: snapshot.id,
      projectId: snapshot.projectId,
      number: snapshot.number,
      title: IssueTitle.restore(snapshot.title),
      type: IssueType.restore(snapshot.type),
      status: IssueStatus.restore(snapshot.status),
      priority: IssuePriority.restore(snapshot.priority),
      listPosition: snapshot.listPosition,
      description: IssueDescription.restore(snapshot.description),
      estimate: snapshot.estimate,
      timeSpent: snapshot.timeSpent,
      timeRemaining: snapshot.timeRemaining,
      reporterId: snapshot.reporterId,
      assigneeIds: snapshot.assigneeIds,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    });
  }

  get id() {
    return this.#id;
  }

  get projectId() {
    return this.#projectId;
  }

  get number() {
    return this.#number;
  }

  get title() {
    return this.#title;
  }

  get type() {
    return this.#type;
  }

  get status() {
    return this.#status;
  }

  get priority() {
    return this.#priority;
  }

  get listPosition() {
    return this.#listPosition;
  }

  get description() {
    return this.#description;
  }

  get estimate() {
    return this.#estimate;
  }

  get timeSpent() {
    return this.#timeSpent;
  }

  get timeRemaining() {
    return this.#timeRemaining;
  }

  get reporterId() {
    return this.#reporterId;
  }

  get assigneeIds() {
    return [...this.#assigneeIds];
  }

  get createdAt() {
    return this.#createdAt;
  }

  get updatedAt() {
    return this.#updatedAt;
  }

  assignNumber(number) {
    this.#number = number;
  }

  update(changes, now = new Date()) {
    this.#title = keep(changes.title, this.#title);
    this.#type = keep(changes.type, this.#type);
    this.#status = keep(changes.status, this.#status);
    this.#priority = keep(changes.priority, this.#priority);
    this.#listPosition = keep(changes.listPosition, this.#listPosition);
    this.#description = keep(changes.description, this.#description);
    this.#estimate = keep(changes.estimate, this.#estimate);
    this.#timeSpent = keep(changes.timeSpent, this.#timeSpent);
    this.#timeRemaining = keep(changes.timeRemaining, this.#timeRemaining);
    this.#reporterId = keep(changes.reporterId, this.#reporterId);
    if (changes.assigneeIds !== undefined) {
      this.#assigneeIds = [...new Set(changes.assigneeIds)];
    }
    this.#updatedAt = now.toISOString();
  }

  toSnapshot() {
    return {
      id: this.#id,
      projectId: this.#projectId,
      number: this.#number,
      title: this.#title.value,
      type: this.#type.value,
      status: this.#status.value,
      priority: this.#priority.value,
      listPosition: this.#listPosition,
      description: this.#description.value,
      estimate: this.#estimate,
      timeSpent: this.#timeSpent,
      timeRemaining: this.#timeRemaining,
      reporterId: this.#reporterId,
      assigneeIds: [...this.#assigneeIds],
      createdAt: this.#createdAt,
      updatedAt: this.#updatedAt,
    };
  }
}
