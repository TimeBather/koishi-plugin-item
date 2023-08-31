import { Context } from 'koishi'
interface ItemTableData{
    key:string
    container:string
}

declare module 'koishi'{
    interface Tables{
        item:ItemTableData
    }
}

export function initDatabase(ctx:Context){
    ctx.database.extend('item',{
        key:'string',
        container:'text'
    },{
        primary:'key'
    })
}