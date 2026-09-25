/**
 * Standardized API Response Helpers
 */
export class ApiResponse {
  /**
   * Generates a successful response object
   * @param {any} data - Payload data
   * @param {string} [message="Success"] - Informative message
   * @param {object} [meta] - Optional pagination or metadata
   */
  static success(data = {}, message = 'Success', meta = undefined) {
    const response = {
      success: true,
      message,
      data
    };
    if (meta) {
      response.meta = meta;
    }
    return response;
  }

  /**
   * Generates an error response object
   * @param {string} message - Error description
   * @param {string} [code="INTERNAL_SERVER_ERROR"] - Error code identifier
   * @param {any} [details=null] - Additional validation or debugging details
   */
  static error(message = 'An unexpected error occurred', code = 'INTERNAL_ERROR', details = null) {
    return {
      success: false,
      error: {
        code,
        message,
        ...(details && { details })
      }
    };
  }
}
