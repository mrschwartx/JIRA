import { MEMBER_ROLES } from './member-role.js';
import { ProjectCategory } from './value-objects/project-category.js';
import { ProjectDescription } from './value-objects/project-description.js';
import { ProjectKey } from './value-objects/project-key.js';
import { ProjectName } from './value-objects/project-name.js';
import { ProjectUrl } from './value-objects/project-url.js';

export class Project {
  #id;
  #ownerId;
  #key;
  #name;
  #url;
  #description;
  #category;
  #createdAt;
  #updatedAt;

  constructor({
    id,
    ownerId,
    key,
    name,
    url,
    description,
    category,
    createdAt,
    updatedAt,
  }) {
    this.#id = id;
    this.#ownerId = ownerId;
    this.#key = key;
    this.#name = name;
    this.#url = url;
    this.#description = description;
    this.#category = category;
    this.#createdAt = createdAt;
    this.#updatedAt = updatedAt;
  }

  static create({
    id,
    ownerId,
    key,
    name,
    url,
    description,
    category,
    now = new Date(),
  }) {
    const timestamp = now.toISOString();
    return new Project({
      id,
      ownerId,
      key,
      name,
      url,
      description,
      category,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static restore(snapshot) {
    return new Project({
      id: snapshot.id,
      ownerId: snapshot.ownerId,
      key: ProjectKey.restore(snapshot.key),
      name: ProjectName.restore(snapshot.name),
      url: ProjectUrl.restore(snapshot.url),
      description: ProjectDescription.restore(snapshot.description),
      category: ProjectCategory.restore(snapshot.category),
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    });
  }

  get id() {
    return this.#id;
  }

  get ownerId() {
    return this.#ownerId;
  }

  get key() {
    return this.#key;
  }

  get name() {
    return this.#name;
  }

  get url() {
    return this.#url;
  }

  get description() {
    return this.#description;
  }

  get category() {
    return this.#category;
  }

  get createdAt() {
    return this.#createdAt;
  }

  get updatedAt() {
    return this.#updatedAt;
  }

  isOwnedBy(userId) {
    return this.#ownerId === userId;
  }

  roleOf(userId) {
    return this.isOwnedBy(userId) ? MEMBER_ROLES.OWNER : MEMBER_ROLES.MEMBER;
  }

  update({ name, url, description, category }, now = new Date()) {
    this.#name = name ?? this.#name;
    this.#url = url ?? this.#url;
    this.#description = description ?? this.#description;
    this.#category = category ?? this.#category;
    this.#updatedAt = now.toISOString();
  }

  toSnapshot() {
    return {
      id: this.#id,
      ownerId: this.#ownerId,
      key: this.#key.value,
      name: this.#name.value,
      url: this.#url.value,
      description: this.#description.value,
      category: this.#category.value,
      createdAt: this.#createdAt,
      updatedAt: this.#updatedAt,
    };
  }
}
