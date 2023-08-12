import {Context, User} from 'koishi'

export type Serializable = string | number | boolean | Serializable[] | {
    [key:string|number] : Serializable
}

export type DynamicableValue<T,C extends any[]=[]> = ((...args:C)=>T) | T

export class ItemRegistry{
    registry:Map<string,Item>
    get(id:string):Item|null{
        //@todo
        return null;
    }
    getOrFail(id:string):Item{
        let item = this.get(id);
        if(!id)
            throw new Error('Item not found:'+id);
        return item;
    }
    getItemOrAir(id:string):Item{
        return this.get(id) ?? this.get('koishi:air');
    }
}

export interface Item{
    stacksTo:DynamicableValue<number>
    create():ItemStack
    use?(stack:ItemStack,user:User):boolean
}

export interface ItemStack{
    id: string
    count: number
    data?: Serializable
}

export abstract class ItemContainer{
    stacks:ItemStack[]
    
    constructor(ctx:Context,stack_count:number){
        for(let i=0; i<stack_count; i++){
            this.stacks.push(ctx.item.registry.getOrFail("koishi:air").create());
        }
    }
}