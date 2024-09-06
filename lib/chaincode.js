/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class Chaincode extends Contract {

    async InitLedger(ctx) {
        
    }

    // CreateoRDER issues a new ORDER to the world state with given details.
    async CreateOrder(ctx, orderJSON) {
        const order = JSON.parse(orderJSON);

        const exists = await this.OrderExists(ctx, order.id);
        if (exists) {
            throw new Error(`The order ${order.id} already exists`);
        }

        await ctx.stub.putState(order.id, Buffer.from(JSON.stringify(order)));
        return JSON.stringify(order);
    }

    // ReadOrder returns the order stored in the world state with given id.
    async ReadOrder(ctx, id) {
        const orderAsBytes = await ctx.stub.getState(id);
        if (!orderAsBytes || orderAsBytes.length === 0) {
            throw new Error(`Order ${id} does not exist`);
        }
        return orderAsBytes.toString();
    }

    // UpdateOrderStatus updates an existing order status in the world state with provided parameters.
    async UpdateOrderStatus(ctx, id, orderStatus, orderProductId, status, proccessDate, trackingNo) {
        const orderAsBytes = await ctx.stub.getState(id);
        if (!orderAsBytes || orderAsBytes.length === 0) {
            throw new Error(`Order ${id} does not exist`);
        }
        
        const order = JSON.parse(orderAsBytes.toString());
        order.orderStatus = orderStatus;  
        
        order.orderProducts.forEach(orderProduct => {
            if(orderProduct.id == orderProductId) {
                orderProduct.status = status;
                orderProduct.proccessDate = proccessDate;

                if(status == "Kargolandi") {
                    orderProduct.trackingNo = trackingNo;
                }
            }
        });

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(order)));
    }

    // OrderExists returns true when order with given ID exists in world state.
    async OrderExists(ctx, id) {
        const orderJSON = await ctx.stub.getState(id);
        return orderJSON && orderJSON.length > 0;
    }

    // GetAllOrders returns all orders found in the world state.
    async GetAllOrders(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = Chaincode;
