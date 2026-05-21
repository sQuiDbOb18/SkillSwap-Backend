export const restrictTo = (role: string) => {
    return (req: any, res: any, next: any) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: "Forbidden" })
        }
        next()
    }
}