import { Context,Observed,Service,Session } from 'koishi';
import { ContainerRegistry, ItemContainer, ItemRegistry } from './item';
import {} from './database'
declare module 'koishi'{
    interface Context{
        item:ItemService
    }
}

export class ItemService extends Service{

    constructor(protected ctx:Context){
        super(ctx,'item');
    }

    readonly itemRegistry : ItemRegistry = new ItemRegistry();

    readonly containerRegistery : ContainerRegistry = new ContainerRegistry(this.ctx);

    async save(id:string,container:ItemContainer,session?:Session<any,any>){
        const dimension = this.containerRegistery.getDimension(id);
        let key = '';
        switch(dimension){
            case 'global':
                key = 'global';
                break;
            case 'channel':
                key = 'channel_'+session?.channelId;
                break;
            case 'user':
                key = 'user_' + session?.userId;
        }
        key = id+'::'+key;
        await this.ctx.database.upsert('item',[
            {key,container:JSON.stringify(container.serialize())}
        ]);
    }

    async load(id:string,session?:Session<any,any>):Promise<ItemContainer>{
        const dimension = this.containerRegistery.getDimension(id);
        let key = '';
        switch(dimension){
            case 'global':
                key = 'global';
                break;
            case 'channel':
                key = 'channel_'+session?.channelId;
                break;
            case 'user':
                key = 'user_' + session?.userId;
        }
        key = id+'::'+key;
        let data = null;
        const containers = (await this.ctx.database.get('item',{key}))?.[0];
        if(containers){
            data = JSON.parse(containers.container);
        }
        return this.containerRegistery.create(id,data);
    }
}