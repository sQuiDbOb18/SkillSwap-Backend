export class CustomError extends Error {
    statusCode: number
    type?: string
    errors?: Array<{ field: string; message: string }>

    constructor(
        message: string,
        statusCode: number,
        options?: {
            type?: string
            errors?: Array<{ field: string; message: string }>
        }
    ) {
        super(message)
        this.statusCode = statusCode
        this.type = options?.type
        this.errors = options?.errors

        Error.captureStackTrace(this, this.constructor)
    }
}
