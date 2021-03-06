import { getRepositoryToken, logger, MIKRO_ORM_MODULE_OPTIONS } from './mikro-orm.common';
import { AnyEntity, Configuration, ConfigurationLoader, EntityManager, EntityName, MikroORM, Options } from '@mikro-orm/core';

import { MikroOrmModuleAsyncOptions, MikroOrmOptionsFactory } from './typings';
import { Provider } from '@nestjs/common';

export const createMikroOrmProvider = (): Provider => ({
  provide: MikroORM,
  useFactory: async (options?: Options | Configuration) => {
    if (!options || Object.keys(options).length === 0) {
      const settings = await ConfigurationLoader.getSettings();

      if (settings.useTsNode) {
        await ConfigurationLoader.registerTsNode(settings.tsConfigPath);
      }

      options = await ConfigurationLoader.getConfiguration();
      options.set('logger', logger.log.bind(logger));
    }

    return MikroORM.init(options);
  },
  inject: [MIKRO_ORM_MODULE_OPTIONS],
});

export const createMikroOrmEntityManagerProvider = (alias?: string): Provider => ({
  provide: alias ?? EntityManager,
  useFactory: (orm: MikroORM) => orm.em,
  inject: [MikroORM],
});

export const createMikroOrmAsyncOptionsProvider = (options: MikroOrmModuleAsyncOptions): Provider => {
  if (options.useFactory) {
    return {
      provide: MIKRO_ORM_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };
  }

  const inject = [];

  if (options.useClass || options.useExisting) {
    inject.push(options.useClass ?? options.useExisting!);
  }

  return {
    provide: MIKRO_ORM_MODULE_OPTIONS,
    useFactory: async (optionsFactory: MikroOrmOptionsFactory) => await optionsFactory.createMikroOrmOptions(),
    inject,
  };
};

export const createAsyncProviders = (options: MikroOrmModuleAsyncOptions): Provider[] => {
  if (options.useExisting || options.useFactory) {
    return [createMikroOrmAsyncOptionsProvider(options)];
  }

  if (options.useClass) {
    return [
      createMikroOrmAsyncOptionsProvider(options),
      { provide: options.useClass, useClass: options.useClass },
    ];
  }

  throw new Error('Invalid MikroORM async options: one of `useClass`, `useExisting` or `useFactory` should be defined.');
};

export const createMikroOrmRepositoryProviders = (entities: EntityName<AnyEntity>[]): Provider[] => {
  return (entities || []).map(entity => ({
    provide: getRepositoryToken(entity),
    useFactory: (em: EntityManager) => em.getRepository(entity),
    inject: [EntityManager],
  }));
};
