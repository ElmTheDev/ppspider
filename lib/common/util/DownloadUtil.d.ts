export declare enum DownloadResult {
    existed = 1,
    success = 2,
    downloadFail = -1,
    saveFail = -2
}
export declare class DownloadUtil {
    static download(url: string, savePath: string, checkExisted?: boolean): Promise<DownloadResult>;
}
