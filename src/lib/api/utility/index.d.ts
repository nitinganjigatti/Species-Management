export declare const GetAPIHeader: (options?: { pharmacy?: boolean }) => Promise<any>
export declare const axiosGet: (options: { url: string; params?: any; pharmacy?: any }) => Promise<any>
export declare const axiosPost: (options: { url: string; body?: any; pharmacy?: any }) => Promise<any>
export declare const axiosFormPost: (options: { url: string; body?: any; pharmacy?: any }) => Promise<any>
export declare const axiosDelete: (options: { url: string; params?: any; pharmacy?: any }) => Promise<any>
export declare const axiosGetExternal: (options: { url: string; params?: any; pharmacy?: any }) => Promise<any>
export declare const axiosAuthFormPost: (options: { url: string; body?: any; pharmacy?: any; authToken?: any }) => Promise<any>
export declare const axiosMLPost: (options: { url: string; data?: any }) => Promise<any>
