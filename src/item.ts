import { Context, User } from 'koishi'

export type Serializable = string | number | boolean | Serializable[] | {
    [key:string|number] : Serializable
}

export type DynamicableValue<T,C extends any[]=[]> = ((...args:C)=>T) | T

export class ItemRegistry{
    registry:Map<string,Item> = new Map();
    constructor(){
        this.registry.set('koishi:air',{
            stacksTo:1,
            create:(count)=>({
                id:'koishi:air',
                count:count ?? 1
            })
        });
    }
    get(id:string):Item|null{
        return this.registry.get(id);
    }
    getOrFail(id:string):Item{
        let item = this.get(id);
        if(!item)
            throw new Error('Item not found:'+id);
        return item;
    }
    getItemOrAir(id:string):Item{
        return this.get(id) ?? this.get('koishi:air');
    }
    register(id:string,item:Item){
        this.registry.set(id,item);
    }
}

export interface Item{
    stacksTo:DynamicableValue<number,[ItemStack]>
    displayName?:DynamicableValue<string,[ItemStack]>
    description?:DynamicableValue<string,[ItemStack]>
    isCompatible?:(a:ItemStack,b:ItemStack) => boolean
    create(count?:number):ItemStack
    use?(stack:ItemStack,user:User):boolean
}

export interface ItemStack{
    id: string
    count: number
    data?: Serializable
}

export interface ItemContainerData{
    title:string,
    stacks:ItemStack[]
}

export function dynamicValue<T,C extends any[]>(value:DynamicableValue<T,C>,...target:C):T{
    return typeof value == 'function' ? (value as any)(...target) : value;
}

export abstract class ItemContainer{
    stacks:ItemStack[] = []

    constructor(protected ctx:Context,protected title:string = "物品栏",protected stack_count:number = 1){
        for(let i=0; i<this.stack_count; i++){
            this.stacks.push(ctx.item.itemRegistry.getOrFail("koishi:air").create(1));
        }
    }

    set(stack:number,item:ItemStack){
        this.stacks[stack] = item;
    }

    get(stack:number):ItemStack|null{
        return this.stacks[stack];
    }

    getStackByItem(item:Item|ItemStack,matcher?:(source:Item|ItemStack,target:ItemStack)=>boolean):number|null{
        if(!matcher)
            matcher = (source:Item|ItemStack,target:ItemStack) => ('id' in source)?source.id == target.id : false;
        for(let i=0;i<this.stack_count;i++){
            if(matcher(item,this.stacks[i])){
                return i;
            }
        }
        return null;
    }

    getAvailableStack(){
        return this.getStackByItem(this.ctx.item.itemRegistry.getOrFail("koishi:air").create(1));
    }

    
    giveItem(item:ItemStack):boolean{
        let count = item.count
        for(let i=0;i<this.stack_count;i++){
            if(this.stacks[i].id == item.id){
                let itemController = this.ctx.item.itemRegistry.get(item.id)
                if(!itemController)
                    continue;
                const stackTo = dynamicValue(itemController.stacksTo,this.stacks[i])
                if(!(this.stacks[i].count < stackTo)){
                    continue;
                }
                if(
                    (itemController.isCompatible && itemController.isCompatible(this.stacks[i],item))||
                    (!itemController.isCompatible && item.data == this.stacks[i].data)
                ){
                    if(this.stacks[i].count + count <= stackTo){
                        this.stacks[i].count += count;
                        return true;
                    }else{
                        let newCount = count + this.stacks[i].count - stackTo;
                        this.stacks[i].count = stackTo;
                        count = newCount;
                    }
                }
            }
        }
        if(count>0){
            return this.giveItemToEmptyStack({
                id:item.id,
                data:item.data,
                count
            });
        }
        return true;
    }

    giveItemToEmptyStack(item:ItemStack):boolean{
        const target = this.getAvailableStack();
        if(target === null){
            return false;
        }
        this.set(target,item);
        return true;
    }

    serialize(){
        return {
            title:this.title,
            stacks:this.stacks
        }
    }

    getItemsText(pagination?:number,currentPage:number=1){
        let text = '';
        let nowCount = 0;
        let allCount = 0;
        this.stacks.forEach(s=>{
            if(s.id == 'koishi:air')
                return;
            const item = this.ctx.item.itemRegistry.get(s.id);
            if(!item)
                return;
            allCount++;
            if(pagination && nowCount > pagination){
                return;
            }
            nowCount++;
            if(pagination && (currentPage-1) * pagination < nowCount){
                return;
            }
            text += '+ '+dynamicValue(item.displayName,s) + " * "+s.count+"\n";
            let description = dynamicValue(item.description,s);
            if(description){
                text += description + "\n";
            }
        })
        if(pagination){
            text += '-------------\n共 '+allCount+'个物品，当前第'+currentPage+'页,共'+Math.ceil(allCount / pagination)+'页'
        }
        return text;
    }

    getContainerText(pagination?:number,currentPage:number=1){
        return this.title+"\n-----------------------\n"+this.getItemsText(pagination,currentPage)
    }
}

export interface ContainerDef{
    id:string
    instance:any // class
    dimension:'user'|'channel'|'global'
}

export class ContainerRegistry extends Map<string,ContainerDef>{
    constructor(protected ctx:Context){
        super();
    }

    register(def:ContainerDef){
        this.set(def.id,def);
    }

    create(id:string,data?:{title:string,stacks:string}){
        if(!this.has(id)){
            return new Error('Container id not found');
        }
        const container = new (this.get(id).instance)(this.ctx,...(data?.title ? [data.title] : []));
        if(data?.stacks){
            container.stacks = data.stacks; 
        }
        return container;
    }

    getDimension(id:string){
        return (this.get(id))?.dimension;
    }
}