import { ExpenseService } from '../services/expense.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { SocketEmitter } from '../sockets/socketEmitter.js';

export class ExpenseController {
  static async addExpense(req, res, next) {
    try {
      const entry = await ExpenseService.recordExpense(
        req.params.familyGroupId,
        req.user._id,
        req.body
      );

      // Real-time broadcast to family room
      SocketEmitter.emitExpenseAdded(req.params.familyGroupId, entry);

      return res.status(201).json(
        ApiResponse.success(entry, 'Expense logged in ledger successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async reverseExpense(req, res, next) {
    try {
      const reversal = await ExpenseService.reverseExpense(
        req.params.familyGroupId,
        req.params.expenseId,
        req.user._id,
        req.body.reason
      );

      // Real-time broadcast to family room
      SocketEmitter.emitExpenseReversed(req.params.familyGroupId, reversal);

      return res.status(201).json(
        ApiResponse.success(reversal, 'Reversing entry created successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getLedger(req, res, next) {
    try {
      const result = await ExpenseService.getFamilyLedger(
        req.params.familyGroupId,
        req.query
      );
      return res.status(200).json(
        ApiResponse.success(result.entries, 'Expense ledger retrieved', result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  static async getSettlements(req, res, next) {
    try {
      const settlements = await ExpenseService.getFamilySettlements(
        req.params.familyGroupId
      );
      return res.status(200).json(
        ApiResponse.success(settlements, 'Family settlements calculated')
      );
    } catch (error) {
      next(error);
    }
  }
}
