// SPDX-License-Identifier: GPL-2.0-or-later
// Browser acceptance test for the actual Blender editor, NOT the core FP16 demo.
// Install locally: npm install --no-save puppeteer pngjs
// Run: BLENDER_URL=https://your-host.example node tests/full-launch.cjs
const puppeteer=require('puppeteer');
const {PNG}=require('pngjs');
const fs=require('node:fs');
const url=process.env.BLENDER_URL || 'http://localhost:8080';
const timeout=Number(process.env.LAUNCH_TIMEOUT_MS || 120000);

(async()=>{
  const browser=await puppeteer.launch({
    headless:process.env.HEADLESS==='false'?false:true,
    args:['--no-sandbox','--enable-unsafe-webgpu','--enable-features=Vulkan,WebGPU,UnsafeWebGPU',
      '--use-gl=angle','--use-angle=swiftshader'],
  });
  try {
    const page=await browser.newPage();
    await page.setViewport({width:1280,height:800,deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(
      ()=>document.querySelector('#progress-phase')?.textContent?.includes('Ready'),
      {timeout}
    );
    const gpu=await page.evaluate(()=>({webgpu:!!navigator.gpu,isolation:crossOriginIsolated}));
    if (!gpu.webgpu || !gpu.isolation) throw new Error('Browser lacks WebGPU or cross-origin isolation');
    await page.evaluate(()=>{
      const ack=document.getElementById('gpu-ack');
      if (ack && !ack.checked) {
        ack.checked=true;
        ack.dispatchEvent(new Event('change',{bubbles:true}));
      }
    });
    await page.waitForFunction(()=>!document.getElementById('start-btn')?.disabled,{timeout:15000});
    await page.click('#start-btn');
    await page.waitForFunction(()=>globalThis.__BGUI__?.device && globalThis.__BGUI__?.window,
      {timeout});
    await page.waitForFunction(()=>document.getElementById('splash')?.classList.contains('done'),
      {timeout:10000});
    await new Promise(r=>setTimeout(r,5000));
    fs.mkdirSync('test-artifacts',{recursive:true});
    const shot=await page.screenshot({path:'test-artifacts/blender.png'});
    const png=PNG.sync.read(shot);
    let mostlyWhite=0;
    for(let i=0;i<png.data.length;i+=4){
      if(png.data[i]>=250 && png.data[i+1]>=250 && png.data[i+2]>=250)mostlyWhite++;
    }
    const whiteFraction=mostlyWhite/(png.width*png.height);
    const status=await page.evaluate(()=>globalThis.__BGUI__);
    console.log(JSON.stringify({url,gpu,status,whiteFraction,errors:errors.slice(-5)},null,2));
    if(whiteFraction>0.98) {
      throw new Error('Native frame signal appeared, but screenshot is nearly all white; editor visually unverified');
    }
    console.log('PASS: actual Blender WebGPU editor visibly rendered');
  } finally {
    await browser.close();
  }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
