// Verificaciones vigentes. No modifica los archivos de la página.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {pathToFileURL} = require('node:url');
const {createRequire} = require('node:module');
const runtimeRequire = createRequire(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'));
const {chromium} = runtimeRequire('playwright');
const root = path.resolve(__dirname,'..');
const url = pathToFileURL(path.join(root,'outputs/Caso-6-Petroleo.html')).href;

async function navigate(page, section) {
  await page.goto(url+'#'+section);
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>fitMath());
}

async function navigation(page) {
  await navigate(page,'portada');
  await page.getByRole('heading',{name:'Introducción',exact:true}).click();
  await page.getByRole('heading',{name:'Introducción al Caso 6',exact:true}).waitFor();
  await page.getByRole('link',{name:'Inicio',exact:true}).click();
  await page.locator('.cover').waitFor();
}

async function stickyHeader(page) {
  await navigate(page,'grado-4');
  await page.evaluate(()=>scrollTo(0,1100));
  assert(Math.abs(await page.locator('nav').evaluate(e=>e.getBoundingClientRect().top))<1);
}

async function tableHeight(page) {
  await navigate(page,'introduccion');
  const heading=page.getByRole('heading',{name:'¿Qué hacemos con mínimos cuadrados?',exact:true});
  const position=()=>heading.evaluate(e=>e.getBoundingClientRect().top+scrollY);
  const before=await position();
  await page.locator('.intro-data-table summary').click();
  assert(Math.abs(await position()-before)<1,'La tabla desplaza el contenido');
  const chart=await page.locator('.intro-data-grid .chart').boundingBox();
  const table=await page.locator('.intro-data-table').boundingBox();
  assert(table.height<=chart.height+1);
}

async function charts(page,section) {
  await navigate(page,section);
  const el=page.locator('.interactive').first();
  assert.equal(await el.locator('polyline').count(),4);
  await el.getByRole('button',{name:'Ocultar curvas',exact:true}).click();
  assert.equal(await el.locator('polyline').count(),0);
  await el.getByRole('button',{name:'Mostrar todo',exact:true}).click();
  await el.locator('[data-series="2"]').uncheck();
  assert.equal(await el.locator('polyline').count(),3);
  const initial=await el.locator('svg').innerHTML();
  await el.getByRole('button',{name:'Acercar',exact:true}).click();
  assert.notEqual(await el.locator('svg').innerHTML(),initial);
  await el.getByRole('button',{name:'1880–1990',exact:true}).click();
  await el.getByRole('button',{name:'Ver extrapolación',exact:true}).click();
  await el.locator('svg').scrollIntoViewIfNeeded();
  const rect=await el.locator('svg').boundingBox();
  const beforeDrag=await el.locator('svg').innerHTML();
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
  await page.mouse.down();
  await page.mouse.move(rect.x+rect.width/2+40,rect.y+rect.height/2+20);
  await page.mouse.up();
  assert.notEqual(await el.locator('svg').innerHTML(),beforeDrag);
  await el.getByRole('button',{name:'Restablecer',exact:true}).click();
  assert.equal(await el.locator('svg').innerHTML(),initial);
  await el.getByRole('button',{name:'Mostrar todo',exact:true}).click();
}

async function responsiveMath(page) {
  for(const width of [1280,1038,800,390]) {
    await page.setViewportSize({width,height:900});
    for(const section of ['grado-2','grado-4','grado-6','limites']) {
      await navigate(page,section);
      if(section==='limites') {
        await page.getByText('Ver el desarrollo del grado 8',{exact:true}).click();
        await page.evaluate(()=>fitMath());
      }
      const overflow=await page.locator('.matrix-equation').evaluateAll(els=>els.some(el=>{
        const r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();
        return r.width>0&&(r.right>p.right-4||r.left<p.left);
      }));
      assert(!overflow,`${section}: matriz fuera del cuadro a ${width}px`);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${section}: desbordamiento horizontal`);
    }
  }
}

async function screenshots(page) {
  const folder=path.join(__dirname,'capturas');
  fs.mkdirSync(folder,{recursive:true});
  await page.setViewportSize({width:1280,height:950});
  for(const section of ['portada','introduccion','grado-6','limites']) {
    await navigate(page,section);
    await page.screenshot({path:path.join(folder,section+'.png')});
  }
}

async function main() {
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
  try {
    const page=await browser.newPage({viewport:{width:1280,height:950}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    if(process.argv.includes('--capturas')) await screenshots(page);
    else {
      await navigation(page); await stickyHeader(page); await tableHeight(page);
      await charts(page,'limites'); await charts(page,'conclusion'); await responsiveMath(page);
    }
    assert.deepEqual(errors,[]);
    console.log('Verificación completada sin errores.');
  } finally { await browser.close(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});

