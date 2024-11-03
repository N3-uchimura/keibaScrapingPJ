/**
 * Scrape.ts
 *
 * class：Scrape
 * function：scraping site
 * updated: 2024/03/26
 **/
export declare class Scrape {
    static browser: any;
    static page: any;
    private _result;
    private _height;
    constructor();
    init(): Promise<void>;
    getTitle(): Promise<string>;
    pressEnter(): Promise<void>;
    doGo(targetPage: string): Promise<void>;
    doClick(elem: string): Promise<void>;
    doType(elem: string, value: string): Promise<void>;
    doClear(elem: string): Promise<void>;
    doSelect(elem: string): Promise<void>;
    doScreenshot(path: string): Promise<void>;
    mouseWheel(): Promise<void>;
    doSingleEval(selector: string, property: string): Promise<string>;
    doMultiEval(selector: string, property: string): Promise<string[]>;
    doWaitFor(time: number): Promise<void>;
    doWaitSelector(elem: string, time: number): Promise<void>;
    doWaitForNav(time: number): Promise<void>;
    doCheckSelector(elem: string): Promise<boolean>;
    doClose(): Promise<void>;
    doReload(): Promise<void>;
    set setSucceed(selector: string);
    get getSucceed(): boolean;
}
