export declare class UserAgents {
    private static userAgents;
    private static randomUserAgentInArr;
    static random(): string;
    static filterByRegex(reg: string | RegExp): string[];
    static randomByRegex(reg: string | RegExp): string;
}
