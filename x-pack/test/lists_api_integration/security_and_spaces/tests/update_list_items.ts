/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from '@kbn/expect';

import { getListItemResponseMockWithoutAutoGeneratedValues } from '../../../../plugins/lists/common/schemas/response/list_item_schema.mock';
import { getCreateMinimalListItemSchemaMock } from '../../../../plugins/lists/common/schemas/request/create_list_item_schema.mock';
import { FtrProviderContext } from '../../common/ftr_provider_context';
import { LIST_URL, LIST_ITEM_URL } from '../../../../plugins/lists/common/constants';

import { getCreateMinimalListSchemaMock } from '../../../../plugins/lists/common/schemas/request/create_list_schema.mock';
import {
  createListsIndex,
  deleteListsIndex,
  removeListItemServerGeneratedProperties,
} from '../../utils';
import { getUpdateMinimalListItemSchemaMock } from '../../../../plugins/lists/common/schemas/request/update_list_item_schema.mock';
import {
  UpdateListItemSchema,
  CreateListItemSchema,
  ListItemSchema,
} from '../../../../plugins/lists/common/schemas';

// eslint-disable-next-line import/no-default-export
export default ({ getService }: FtrProviderContext) => {
  const supertest = getService('supertest');

  describe('update_list_items', () => {
    describe('update list items', () => {
      beforeEach(async () => {
        await createListsIndex(supertest);
      });

      afterEach(async () => {
        await deleteListsIndex(supertest);
      });

      it('should update a single list item property of value using an id', async () => {
        // create a simple list
        await supertest
          .post(LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListSchemaMock())
          .expect(200);

        // create a simple list item
        await supertest
          .post(LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListItemSchemaMock())
          .expect(200);

        // update a simple list item's value
        const updatedListItem: UpdateListItemSchema = {
          ...getUpdateMinimalListItemSchemaMock(),
          value: '192.168.0.2',
        };

        const { body } = await supertest
          .put(LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(updatedListItem)
          .expect(200);

        const outputListItem: Partial<ListItemSchema> = {
          ...getListItemResponseMockWithoutAutoGeneratedValues(),
          value: '192.168.0.2',
        };
        const bodyToCompare = removeListItemServerGeneratedProperties(body);
        expect(bodyToCompare).to.eql(outputListItem);
      });

      it('should update a single list item of value using an auto-generated id of both list and list item', async () => {
        const { id, ...listNoId } = getCreateMinimalListSchemaMock();
        // create a simple list with no id which will use an auto-generated id
        const { body: createListBody } = await supertest
          .post(LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(listNoId)
          .expect(200);

        // create a simple list item also with an auto-generated id using the list's auto-generated id
        const listItem: CreateListItemSchema = {
          ...getCreateMinimalListItemSchemaMock(),
          list_id: createListBody.id,
        };
        const { body: createListItemBody } = await supertest
          .post(LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(listItem)
          .expect(200);

        // update a simple list item's value
        const updatedList: UpdateListItemSchema = {
          ...getUpdateMinimalListItemSchemaMock(),
          id: createListItemBody.id,
          value: '192.168.0.2',
        };
        const { body } = await supertest
          .put(LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(updatedList)
          .expect(200);

        const outputListItem: Partial<ListItemSchema> = {
          ...getListItemResponseMockWithoutAutoGeneratedValues(),
          value: '192.168.0.2',
        };
        const bodyToCompare = {
          ...removeListItemServerGeneratedProperties(body),
          list_id: outputListItem.list_id,
        };
        expect(bodyToCompare).to.eql(outputListItem);
      });

      it('should give a 404 if it is given a fake id', async () => {
        // create a simple list
        await supertest
          .post(LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListSchemaMock())
          .expect(200);

        // create a simple list item
        await supertest
          .post(LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListItemSchemaMock())
          .expect(200);

        // update a simple list item's value
        const updatedListItem: UpdateListItemSchema = {
          ...getUpdateMinimalListItemSchemaMock(),
          id: 'some-other-id',
          value: '192.168.0.2',
        };

        const { body } = await supertest
          .put(LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(updatedListItem)
          .expect(404);

        expect(body).to.eql({
          status_code: 404,
          message: 'list item id: "some-other-id" not found',
        });
      });
    });
  });
};