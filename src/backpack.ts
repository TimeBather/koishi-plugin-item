import { ItemContainer } from "./item";
import { Context } from 'koishi'

export class BackpackContainer extends ItemContainer{
    constructor(protected ctx:Context,protected title:string = "物品栏"){
        super(ctx,'背包',64);
    }
}

export function registerBackpack(ctx:Context){
    ctx.item.containerRegistery.register({
        id:'koishi:backpack',
        instance:BackpackContainer,
        dimension:'user'
    })
    ctx.command('backpack.get')
        .action(async (argv)=>{
            const backpack = await ctx.item.load('koishi:backpack',argv.session);
            return backpack.getContainerText();
        })
}