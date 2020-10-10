import "reflect-metadata";
declare type Constructor<T> = new (...args: any[]) => T;
declare type BeanId<T> = string | Constructor<T>;
declare type BeanDefinition = {
    id?: BeanId<any>;
    target: Constructor<any>;
    field?: string;
    method?: string;
};
export interface AfterInit {
    afterInit(): any;
}
export declare function Bean(id?: string): (target: any, fieldOrMethod?: string, descriptor?: any) => any;
export declare function Autowired(id?: BeanId<any>): (target: any, fieldOrMethod: string, paramIndex?: number) => void;
export declare function getBean<T>(id: BeanId<T>, createBeanDefinitionIfNotExisted?: boolean): T;
export declare function findBean<T>(id: BeanId<T>, type: any): any;
export declare function existBean(id: BeanId<any>): boolean;
export declare function registeBean<T>(id: BeanId<T>, ins: T, beanDefinition?: BeanDefinition, ignoreIfExisted?: boolean): void;
export {};
