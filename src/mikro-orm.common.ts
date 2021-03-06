import { EntityName, MikroORM, Utils } from '@mikro-orm/core';
import { Inject, Logger } from '@nestjs/common';

export const MIKRO_ORM_MODULE_OPTIONS = Symbol('mikro-orm-module-options');
export const logger = new Logger(MikroORM.name);
export const getRepositoryToken = <T> (entity: EntityName<T>) => `${Utils.className(entity)}Repository`;
export const InjectRepository = <T> (entity: EntityName<T>) => Inject(getRepositoryToken(entity));
