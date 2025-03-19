export function all<T>(...validators: ((value: T) => React.ReactNode)[]): (value: T) => React.ReactNode {
    return (value: T) => {
        for (const validator of validators) {
            const error = validator(value);
            if (error !== null)
                return error;
        }
        return null;
    }
}
