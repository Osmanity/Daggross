import express from 'express';
import authUser from '../middlewares/authUser.js';
import { getAllOrders, getUserOrders, placeOrderCOD, placeOrderStripe, updateOrder, deleteOrder, updateCODStatus } from '../controllers/orderController.js';
import authSeller from '../middlewares/authSeller.js';

const orderRouter = express.Router();

orderRouter.post('/cod', authUser, placeOrderCOD)
orderRouter.get('/user', authUser, getUserOrders)
orderRouter.get('/seller', authSeller, getAllOrders)
orderRouter.post('/stripe', authUser, placeOrderStripe)
orderRouter.put('/:orderId', authSeller, updateOrder)
orderRouter.delete('/:orderId', authSeller, deleteOrder)
orderRouter.put('/:orderId/cod-status', authSeller, updateCODStatus)

export default orderRouter;