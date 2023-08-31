import { Context, Schema } from 'koishi'
import { initDatabase } from './database';
import { ItemService } from './service';
import { registerBackpack } from './backpack';

export const name = 'item'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export const using = ['database']

export function apply(ctx: Context) {
    initDatabase(ctx);
    ctx.plugin(ItemService);
    ctx.using(['item'],(ctx:Context)=>{
        registerBackpack(ctx);
    })
}

export * from './service';