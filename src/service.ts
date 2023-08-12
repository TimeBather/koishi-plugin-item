import {Service,Context} from 'koishi';
import { ItemRegistry } from './item';

declare module 'koishi'{
    interface Context{
        item:ItemService
    }
}

export class ItemService extends Service{

    constructor(ctx:Context){
        super(ctx,'item');
    }

    readonly registry : ItemRegistry = new ItemRegistry();
}