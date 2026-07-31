/* 扫描 public/static/assets，生成 manifest.json
 * 前端 Assets.opt() 只会请求清单里存在的可选素材，避免 404 噪音。
 * 导入新美术素材后执行：npm run assets:index
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'public', 'static', 'assets');
const files = readdirSync(dir).filter(f => /\.(webp|png)$/i.test(f));

const map = {};   // id -> 扩展名（webp 优先）
for (const f of files) {
  const m = f.match(/^(.+)\.(webp|png)$/i);
  if (!m) continue;
  const id = m[1], ext = m[2].toLowerCase();
  if (map[id] === 'webp') continue;
  map[id] = ext;
}

const out = { generated: new Date().toISOString().slice(0, 10), assets: map };
writeFileSync(join(dir, 'manifest.json'), JSON.stringify(out));
console.log(`manifest.json: ${Object.keys(map).length} 个素材`);
