import { CommentBody } from './comment-body.js';

export class Comment {
  #id;
  #issueId;
  #authorId;
  #body;
  #createdAt;
  #updatedAt;

  constructor({ id, issueId, authorId, body, createdAt, updatedAt }) {
    this.#id = id;
    this.#issueId = issueId;
    this.#authorId = authorId;
    this.#body = body;
    this.#createdAt = createdAt;
    this.#updatedAt = updatedAt;
  }

  static create({ id, issueId, authorId, body, now = new Date() }) {
    const timestamp = now.toISOString();
    return new Comment({
      id,
      issueId,
      authorId,
      body,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static restore(snapshot) {
    return new Comment({
      id: snapshot.id,
      issueId: snapshot.issueId,
      authorId: snapshot.authorId,
      body: CommentBody.restore(snapshot.body),
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    });
  }

  get id() {
    return this.#id;
  }

  get issueId() {
    return this.#issueId;
  }

  get authorId() {
    return this.#authorId;
  }

  get body() {
    return this.#body;
  }

  get createdAt() {
    return this.#createdAt;
  }

  get updatedAt() {
    return this.#updatedAt;
  }

  isAuthoredBy(userId) {
    return this.#authorId === userId;
  }

  edit(body, now = new Date()) {
    this.#body = body;
    this.#updatedAt = now.toISOString();
  }

  toSnapshot() {
    return {
      id: this.#id,
      issueId: this.#issueId,
      authorId: this.#authorId,
      body: this.#body.value,
      createdAt: this.#createdAt,
      updatedAt: this.#updatedAt,
    };
  }
}
