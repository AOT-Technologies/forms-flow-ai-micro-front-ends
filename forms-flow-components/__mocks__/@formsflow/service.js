export const  HelperServices = {
    "getLocalDateAndTime": ()=>{}
}

export const StyleServices = {
    "getCSSVariable": (variableName) => {
        // Get CSS variable from document root
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            return getComputedStyle(document.documentElement)
                .getPropertyValue(variableName)
                .trim();
        }
        return '';
    },
}

export const StorageService = {
    get: (key) => null,
    save: (key, value) => {},
    User: {
        USER_ROLE: 'UserRoles',
        USER_DETAILS: 'UserDetails',
    }
}
