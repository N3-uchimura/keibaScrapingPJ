/**
 * myScraper.ts
 *
 * class：Scrape
 * function：scraping site
 **/
export declare class Scrape {
    static browser: any;
    static page: any;
    constructor();
    init(): Promise<void>;
    doGo(targetPage: string): Promise<void>;
    doClick(elem: string): Promise<void>;
    getUrl(): Promise<string>;
    doType(elem: string, value: string): Promise<void>;
    doSelect(elem: string): Promise<void>;
    doScreenshot(path: string): Promise<void>;
    doSingleEval(selector: string, property: string): Promise<string>;
    doMultiEval(selector: string, property: string): Promise<string[]>;
    doWaitFor(time: number): Promise<void>;
    doWaitSelector(elem: string, time: number): Promise<void>;
    doWaitNav(): Promise<void>;
    doClose(): Promise<void>;
    detectPage(element: string): Promise<boolean>;
}
