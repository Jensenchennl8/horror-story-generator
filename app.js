/*
  恐怖故事生成器（疗愈版）- 可运行离线原型
  - 单页应用（hash router）
  - LocalStorage 存档
  - 规则/模板生成：fearType + 五幕 + 金钥匙
  - 安全：温和/标准/重口 强度；高风险词拦截
*/

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const STORAGE_KEY = 'horror_healing_records_v1';
const DRAFT_KEY = 'horror_healing_draft_v1';

const FearType = {
  ABANDONMENT: '被抛弃恐惧',
  LOSS_OF_CONTROL: '失控恐惧',
  FAILURE: '失败恐惧',
  DEATH: '死亡恐惧',
  EXPOSURE: '暴露恐惧',
  CONFLICT: '冲突恐惧',
  CHOICE: '选择恐惧',
  MEANINGLESSNESS: '无意义恐惧',
};

const GOLDEN_QUOTES = {
  [FearType.ABANDONMENT]: { symbol: '自我陪伴', quote: '“学会独处，是终身浪漫的开始”' },
  [FearType.LOSS_OF_CONTROL]: { symbol: '当下力量', quote: '“你无法控制风向，但可以调整风帆”' },
  [FearType.FAILURE]: { symbol: '真实自我', quote: '“完美是完成的敌人”' },
  [FearType.DEATH]: { symbol: '珍惜当下', quote: '“生命的长度不重要，重要的是深度”' },
  [FearType.EXPOSURE]: { symbol: '自我接纳', quote: '“真实的你，比完美的你更有力量”' },
  [FearType.CONFLICT]: { symbol: '内在平静', quote: '“平静不是没有风暴，而是在风暴中保持宁静”' },
  [FearType.CHOICE]: { symbol: '信任直觉', quote: '“没有错误的选择，只有不同的风景”' },
  [FearType.MEANINGLESSNESS]: { symbol: '创造意义', quote: '“意义不是被发现的，而是被创造的”' },
};

const ArchetypeByQ1 = {
  A: '整合者',
  B: '守护者',
  C: '分析者',
};

const ScenarioByQ2 = {
  A: '无尽走廊',
  B: '镜像房间',
  C: '崩塌迷宫',
};

const SymbolByQ3 = {
  A: '生锈的钥匙',
  B: '空白日记',
  C: '停止的手表',
};

const MonsterByFear = {
  [FearType.ABANDONMENT]: '无形威胁',
  [FearType.LOSS_OF_CONTROL]: '无形威胁',
  [FearType.FAILURE]: '分身',
  [FearType.DEATH]: '远古邪神',
  [FearType.EXPOSURE]: '变形怪',
  [FearType.CONFLICT]: '复仇怨灵',
  [FearType.CHOICE]: '分身',
  [FearType.MEANINGLESSNESS]: '远古邪神',
};

// 微行动库（每类挑 3 条）
const ACTION_LIBRARY = {
  [FearType.ABANDONMENT]: [
    '写下：今天我最想被谁看见？我能怎么先看见自己？（2分钟）',
    '给自己发一条短信/备忘录：我今天做到的一件小事。（1分钟）',
    '做一个“自我陪伴仪式”：泡一杯热饮，安静坐 5 分钟，不刷手机。'
  ],
  [FearType.LOSS_OF_CONTROL]: [
    '列出：我能控制的 3 件事 / 不能控制的 3 件事。（2分钟）',
    '做 6 次“4-6 呼吸”：吸气4秒，呼气6秒。',
    '给“未知”一个边界：把最担心的事写成一句话，然后写一个可执行的下一步。'
  ],
  [FearType.FAILURE]: [
    '把“我不够好”改写成“我正在练习___”。填空并念三遍。',
    '写 1 条反证：过去我成功完成过的类似事情是什么？',
    '做一个“完成优先”的 10 分钟小任务：只求完成不求完美。'
  ],
  [FearType.DEATH]: [
    '写下今天最想珍惜的一个瞬间，并用 3 句话描述它。',
    '给未来 24 小时做一个“最小清单”：只保留 3 件最重要的事。',
    '做一次“感官落地”：说出你看到/听到/触到的各 3 个细节。'
  ],
  [FearType.EXPOSURE]: [
    '写下：我害怕别人看到的“真实的我”是什么？它真的不可被接受吗？',
    '选择一个安全对象，分享一件“并不完美”的小事实（可从文字开始）。',
    '给自己一句许可：我可以在不完美中被爱、被接纳。'
  ],
  [FearType.CONFLICT]: [
    '把想说的话写成三段：事实/感受/请求（NVC）。',
    '练习一句边界句：我需要一点时间想清楚再回复。',
    '做 2 分钟肩颈放松，先让身体回到安全感。'
  ],
  [FearType.CHOICE]: [
    '写下两个选项的“代价”各 3 条，而不是只写收益。',
    '问自己：如果我不怕错，我会选哪个？',
    '给选择设定复盘时间：7 天后回看一次，而不是当下要求完美。'
  ],
  [FearType.MEANINGLESSNESS]: [
    '写下：我愿意为哪件小事付出 20 分钟？今天就做。',
    '列 3 个我曾经帮助过别人/被帮助过的瞬间。',
    '做一个“创造第一笔”：写一句话/画一条线/拍一张照片。'
  ],
};

// 高风险词（非常简化版）：出现则强制温和 + 提示求助
const HIGH_RISK = [
  '自杀','轻生','不想活','想死','结束生命','割腕','跳楼','吞药','遗书','抑郁到想死'
];

function toast(msg){
  const wrap = $('#toast');
  const div = document.createElement('div');
  div.className = 't';
  div.textContent = msg;
  wrap.appendChild(div);
  setTimeout(()=>{ div.style.opacity='0'; div.style.transition='opacity .4s ease'; }, 2600);
  setTimeout(()=> div.remove(), 3200);
}

function nowISO(){
  const d = new Date();
  const pad = (n)=> String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function uid(){
  return Math.random().toString(16).slice(2) + '-' + Date.now().toString(16);
}

function loadRecords(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch{ return []; }
}
function saveRecords(records){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}
function loadDraft(){
  try{ return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); }
  catch{ return null; }
}
function saveDraft(d){
  localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
}
function clearDraft(){
  localStorage.removeItem(DRAFT_KEY);
}

function containsHighRisk(text){
  const t = (text||'').toLowerCase();
  return HIGH_RISK.find(k => t.includes(k));
}

function detectFearType(diary, presetFearType){
  if(presetFearType) return presetFearType;
  const t = (diary||'').toLowerCase();
  // 简单关键词规则（可替换成模型）
  const rules = [
    { fear: FearType.ABANDONMENT, keys: ['孤独','被抛弃','没人','离开我','不被爱','被忽视','冷落'] },
    { fear: FearType.LOSS_OF_CONTROL, keys: ['失控','控制不了','焦虑','恐慌','不确定','未知','崩溃','来不及'] },
    { fear: FearType.FAILURE, keys: ['失败','不够好','丢脸','羞愧','搞砸','被嘲笑','无能'] },
    { fear: FearType.DEATH, keys: ['死亡','病','终结','失去生命','倒计时','告别','葬礼'] },
    { fear: FearType.EXPOSURE, keys: ['暴露','被看穿','秘密','丢人','真实的我','被拒绝','社死'] },
    { fear: FearType.CONFLICT, keys: ['吵架','冲突','争执','被攻击','害怕对抗','不敢说','被伤害'] },
    { fear: FearType.CHOICE, keys: ['选择','后悔','纠结','两难','错决定','决定不了','分岔'] },
    { fear: FearType.MEANINGLESSNESS, keys: ['没有意义','空虚','迷茫','无价值','虚无','麻木','活着为了什么'] },
  ];
  for(const r of rules){
    if(r.keys.some(k => t.includes(k))) return r.fear;
  }
  // fallback：根据情绪词
  if(t.includes('害怕')||t.includes('恐惧')) return FearType.LOSS_OF_CONTROL;
  return FearType.FAILURE;
}

function normalizeIntensity(intensity, diary){
  const risk = containsHighRisk(diary);
  if(risk) return { intensity: '温和', forced: true, riskWord: risk };
  return { intensity, forced: false, riskWord: null };
}

function computeStoryConfig(draft){
  const fear = detectFearType(draft.diary, draft.presetFearType);
  const q = draft.test || { q1:'A', q2:'A', q3:'A' };
  return {
    fearType: fear,
    protagonistArchetype: ArchetypeByQ1[q.q1],
    horrorScenario: ScenarioByQ2[q.q2],
    horrorSymbol: SymbolByQ3[q.q3],
    monsterArchetype: MonsterByFear[fear],
  };
}

function pick(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

function genStory(config, diary, intensity){
  // 可替换变量
  const places = ['地铁站台','老旧公寓的走廊','空荡的写字楼','雾中的小镇','没有信号的酒店','停电的图书馆'];
  const times = ['凌晨 01:13','黄昏','雨夜','停电后的深夜','周末的清晨','午夜'];
  const lights = ['冷白的应急灯','忽明忽暗的霓虹','像呼吸一样闪烁的灯管','被雾吞没的路灯','微弱的手机屏光'];

  const tone = intensity === '重口'
    ? { adj:'刺骨', gore: true, soft:false }
    : intensity === '标准'
      ? { adj:'阴冷', gore:false, soft:false }
      : { adj:'微凉', gore:false, soft:true };

  const place = pick(places);
  const time = pick(times);
  const light = pick(lights);

  // 从日记里抽一点“客观事件”
  const inciting = diary?.trim()?.slice(0, 60) || '你今天经历了一件看似普通、却让你心里发紧的事。';

  const symbol = config.horrorSymbol;
  const scenario = config.horrorScenario;
  const monster = config.monsterArchetype;
  const fear = config.fearType;

  const bodyHorrorLine = tone.gore
    ? '你低头时发现自己的影子在地面上慢慢“裂开”，像被撕开的纸一样。'
    : '你低头时发现自己的影子慢了一拍，像在犹豫要不要跟上你。';

  const gentlePivot = tone.soft
    ? '你忽然意识到：这里的一切，都在等你先对自己说一句话。'
    : '你忽然意识到：外面的怪物之所以靠近，是因为你一直在逃开内心的某个答案。';

  // 五幕
  const act1 = `【第一幕：失衡】\n${time}。你来到${place}。${light}在${scenario}的尽头${tone.adj}地闪烁。\n\n引爆事件：${inciting}\n\n你握着一件东西：${symbol}。它像一段被你反复按下“暂停”的记忆。`;

  const act2 = `【第二幕：对抗】\n脚步声从你身后响起——不是别人的，是“你自己的”。\n${bodyHorrorLine}\n\n你开始听见一些话：\n- “别再尝试了。”\n- “你会搞砸。”\n- “他们迟早会离开。”\n\n这些话像不可靠叙述者，把现实写成了最坏的版本。`;

  const act3 = `【第三幕：深渊】\n你终于看见了它：${monster}。\n它不急着追你，只是站在光照不到的边缘，重复你的某句想法。\n\n你明白了——这不是为了伤害你，而是为了让你承认一个核心信念：\n“${coreBeliefFromFear(fear)}”\n\n你感到胸口发紧，像被迫直视一面镜子。`;

  const act4 = `【第四幕：转化】\n就在你想转身逃走时，${symbol}轻轻一震。\n你在墙缝/口袋/掌心里发现一把发光的金色钥匙。\n钥匙上刻着两个字：\n“${GOLDEN_QUOTES[fear].symbol}”。\n\n${gentlePivot}\n\n顿悟：${insightFromFear(fear)}\n\n你没有杀死怪物，你只是把目光从它身上移开——转向你自己。`;

  const act5 = `【第五幕：新生】\n灯光稳定下来，${scenario}不再延伸。\n${monster}像潮水退去一样淡化。\n\n你推开一扇门，门后不是终点，而是一个可以呼吸的清晨。\n你知道：恐惧没有消失，但你已经拥有了钥匙。`;

  const title = titleFromConfig(config);
  return { title, content: [act1, act2, act3, act4, act5].join('\n\n') };
}

function titleFromConfig(config){
  const map = {
    '无尽走廊':'《无尽走廊》',
    '镜像房间':'《镜中镜》',
    '崩塌迷宫':'《崩塌迷宫》',
  };
  return map[config.horrorScenario] || '《夜的回声》';
}

function coreBeliefFromFear(fear){
  const map = {
    [FearType.ABANDONMENT]:'我不值得被爱',
    [FearType.LOSS_OF_CONTROL]:'我无法应对未知',
    [FearType.FAILURE]:'我不够好',
    [FearType.DEATH]:'终结是可怕的',
    [FearType.EXPOSURE]:'真实的我会被拒绝',
    [FearType.CONFLICT]:'我无法保护自己',
    [FearType.CHOICE]:'我会做出错误决定',
    [FearType.MEANINGLESSNESS]:'我的存在没有价值',
  };
  return map[fear] || '我不够好';
}

function insightFromFear(fear){
  const map = {
    [FearType.ABANDONMENT]:'我可以先成为自己的同伴，而不是把“被留下”当作价值证明。',
    [FearType.LOSS_OF_CONTROL]:'我不需要掌控一切，我只需要掌控下一步。',
    [FearType.FAILURE]:'我可以不完美地前进；完成比完美更接近自由。',
    [FearType.DEATH]:'我无法延长时间，但可以加深此刻的存在感。',
    [FearType.EXPOSURE]:'真实不是缺陷，而是连接的入口。',
    [FearType.CONFLICT]:'我可以温柔但坚定地表达边界，保护自己。',
    [FearType.CHOICE]:'选择不是审判，而是路径；我可以允许自己修正。',
    [FearType.MEANINGLESSNESS]:'意义来自创造与连接，不来自“被证明”。',
  };
  return map[fear] || '我可以不完美地前进。';
}

function genGoldenKey(config){
  const fear = config.fearType;
  const base = GOLDEN_QUOTES[fear];
  return {
    symbol: base.symbol,
    highlightQuote: base.quote,
    interpretation: goldenInterpretation(fear),
    coreBelief: coreBeliefFromFear(fear),
    actions: ACTION_LIBRARY[fear] || [],
    affirmation: affirmationFromFear(fear),
  };
}

function goldenInterpretation(fear){
  const map = {
    [FearType.ABANDONMENT]:'你渴望被留住，往往让你把价值交给别人。钥匙提醒你：你可以先给自己稳定的陪伴。',
    [FearType.LOSS_OF_CONTROL]:'你并不需要控制所有变量。钥匙提醒你：把注意力收回到“当下可做的一步”。',
    [FearType.FAILURE]:'你把一次失误等同于自我否定。钥匙提醒你：允许练习与迭代，才会进步。',
    [FearType.DEATH]:'你害怕终结，因此忽略了生活的密度。钥匙提醒你：把此刻过深一点。',
    [FearType.EXPOSURE]:'你害怕被拒绝，于是选择隐藏。钥匙提醒你：真实会带来连接，而不是只带来风险。',
    [FearType.CONFLICT]:'你把冲突等同于危险。钥匙提醒你：表达边界，是一种保护而不是攻击。',
    [FearType.CHOICE]:'你害怕做错，于是迟迟不动。钥匙提醒你：选择本身就是前进，复盘比完美更重要。',
    [FearType.MEANINGLESSNESS]:'你把价值寄托在宏大答案。钥匙提醒你：意义来自你每天创造的那一小笔。',
  };
  return map[fear] || '钥匙提醒你：先照顾自己，然后再向前。';
}

function affirmationFromFear(fear){
  const map = {
    [FearType.ABANDONMENT]:'我足够完整，我值得被自己深爱。',
    [FearType.LOSS_OF_CONTROL]:'我可以在不确定中保持稳定，我能走好下一步。',
    [FearType.FAILURE]:'我不需要完美，我只需要持续练习。',
    [FearType.DEATH]:'我珍惜此刻，让生命在深度中发光。',
    [FearType.EXPOSURE]:'真实的我有力量，我可以被看见。',
    [FearType.CONFLICT]:'我可以温柔而坚定地保护自己。',
    [FearType.CHOICE]:'我信任自己可以修正，我允许选择带我前进。',
    [FearType.MEANINGLESSNESS]:'我创造意义，从今天这一小步开始。',
  };
  return map[fear] || '我值得被善待。';
}

function render(){
  const hash = location.hash || '#/';
  const route = hash.replace('#','');
  const app = $('#app');

  if(route.startsWith('/archive')) return renderArchive(app);
  if(route.startsWith('/diary')) return renderDiary(app);
  if(route.startsWith('/test')) return renderTest(app);
  if(route.startsWith('/config')) return renderConfig(app);
  if(route.startsWith('/loading')) return renderLoading(app);
  if(route.startsWith('/story')) return renderStory(app);
  if(route.startsWith('/golden-key')) return renderGoldenKey(app);
  return renderHome(app);
}

function renderHome(app){
  const draft = loadDraft();

  app.innerHTML = `
    <section class="hero">
      <h1>恐怖故事生成器</h1>
      <div class="subtitle">Offer your emotion. Accept your curse.</div>

      <div class="maskRow" aria-hidden="true">
        <div class="mask"><img src="./assets/ref1.jpg" alt="" /></div>
        <div class="mask"><img src="./assets/ref2.jpg" alt="" /></div>
        <div class="mask"><img src="./assets/ref1.jpg" alt="" style="transform:scale(1.12) translateX(-8px)" /></div>
      </div>
    </section>

    <div class="grid" style="margin-top:6px">
      <section class="card">
        <div class="hd">
          <h2>开始探索</h2>
          <p class="muted small">把你的情绪交给故事。故事会把恐惧“具象化”，并在结尾交还一把金钥匙。</p>
        </div>
        <div class="bd">
          <div class="row" style="align-items:flex-end">
            <div class="field" style="flex:1.2">
              <div class="label">恐怖强度</div>
              <select id="intensity">
                <option value="温和">温和（更安全/更舒缓）</option>
                <option value="标准" selected>标准（心理恐怖为主）</option>
                <option value="重口">重口（更强压迫感）</option>
              </select>
              <div class="small muted">若出现高风险内容，将自动降级为温和，并提示求助。</div>
            </div>
            <div class="field" style="flex:1">
              <div class="label">结尾偏好</div>
              <div class="row">
                <button class="btn" id="end1">行动</button>
                <button class="btn" id="end2">被理解</button>
              </div>
            </div>
          </div>

          <div class="hr"></div>

          <h3>恐惧类型（可选）</h3>
          <p class="muted small">你可以先选一个主题（不选也可以；系统会根据日记自动判定）。</p>
          <div class="fearGrid" id="fearGrid"></div>

          <div class="hr"></div>
          <p class="muted small">免责声明：本产品为自我探索工具，不替代心理咨询/医疗建议。如你出现自伤/轻生想法，请立即寻求身边帮助或联系当地求助热线。</p>
        </div>
        <div class="ft">
          ${draft ? `<button class="btn" id="btnContinue">继续上次</button>` : ''}
          <button class="btn btn-primary" id="btnStart">进入日记</button>
        </div>
      </section>

      <aside class="card">
        <div class="hd">
          <h2>你会得到什么</h2>
        </div>
        <div class="bd">
          <div class="list">
            <div class="option">
              <div><span class="k">1</span>五幕疗愈弧线故事</div>
              <div class="muted small">失衡 → 对抗 → 深渊 → 转化 → 新生</div>
            </div>
            <div class="option">
              <div><span class="k">2</span>金钥匙（行动）</div>
              <div class="muted small">金句 + 核心信念 + 3 条可执行建议</div>
            </div>
            <div class="option">
              <div><span class="k">3</span>恐惧档案</div>
              <div class="muted small">记录情绪前后变化（本地存储）</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `;

  const intensitySel = $('#intensity');
  intensitySel.value = draft?.intensity || '标准';

  // Build fear tiles
  const fears = [
    { id: FearType.ABANDONMENT, n: 'The Abandonment', t: '被抛弃恐惧' },
    { id: FearType.LOSS_OF_CONTROL, n: 'The Unraveling', t: '失控恐惧' },
    { id: FearType.FAILURE, n: 'The Broken Mirror', t: '失败恐惧' },
    { id: FearType.DEATH, n: 'The Countdown', t: '死亡恐惧' },
    { id: FearType.EXPOSURE, n: 'The Unmasked', t: '暴露恐惧' },
    { id: FearType.CONFLICT, n: 'The Pursuit', t: '冲突恐惧' },
    { id: FearType.CHOICE, n: 'The Fork', t: '选择恐惧' },
    { id: FearType.MEANINGLESSNESS, n: 'The Empty Stair', t: '无意义恐惧' },
  ];
  const grid = $('#fearGrid');
  const selected = draft?.presetFearType || null;
  grid.innerHTML = fears.map(f => `
    <div class="fearTile" data-fear="${f.id}" style="${selected===f.id ? 'border-color:rgba(255,255,255,.22); background:rgba(255,255,255,.05)' : ''}">
      <div class="n">${f.n}</div>
      <div class="t">${f.t}</div>
    </div>
  `).join('');

  $$('#fearGrid .fearTile').forEach(el => {
    el.onclick = () => {
      const fear = el.getAttribute('data-fear');
      const d = loadDraft() || { id: uid(), createdAt: nowISO() };
      d.presetFearType = (d.presetFearType === fear) ? null : fear;
      d.intensity = intensitySel.value;
      d.endingPref = d.endingPref || '行动';
      saveDraft(d);
      render();
      toast(d.presetFearType ? `已选择：${d.presetFearType}` : '已取消选择');
    };
  });

  $('#btnStart').onclick = () => {
    const d = loadDraft() || { id: uid(), createdAt: nowISO() };
    d.intensity = intensitySel.value;
    d.endingPref = d.endingPref || '行动';
    saveDraft(d);
    location.hash = '#/diary';
  };

  if(draft){
    $('#btnContinue').onclick = ()=> location.hash = draft.stage ? `#/${draft.stage}` : '#/diary';
  }

  $('#end1').onclick = ()=>{ const d = loadDraft()||{id:uid(),createdAt:nowISO()}; d.endingPref='行动'; d.intensity=intensitySel.value; saveDraft(d); toast('结尾偏好：行动'); };
  $('#end2').onclick = ()=>{ const d = loadDraft()||{id:uid(),createdAt:nowISO()}; d.endingPref='理解'; d.intensity=intensitySel.value; saveDraft(d); toast('结尾偏好：被理解'); };
}

function renderDiary(app){
  const draft = loadDraft() || { id: uid(), createdAt: nowISO(), intensity:'标准', endingPref:'行动' };
  draft.stage = 'diary';
  saveDraft(draft);

  app.innerHTML = `
    <section class="card">
      <div class="hd">
        <h2>Step 1 · 情绪日记</h2>
        <p class="muted">写下今天发生了什么，以及你感受到什么。无需修饰，就像在对一个安全的人倾诉。</p>
      </div>
      <div class="bd">
        <div class="row">
          <div class="field">
            <div class="label">你的情绪日记（建议 100-500 字）</div>
            <textarea id="diary" placeholder="今天发生了什么？你感受到了什么？"></textarea>
            <div class="row" style="align-items:center">
              <span class="muted small">字数：<span id="count">0</span></span>
              <span class="muted small">强度：<span class="kbd" id="int">${draft.intensity}</span></span>
            </div>
            <div class="small muted" id="riskHint" style="display:none"></div>
          </div>
        </div>
      </div>
      <div class="ft">
        <button class="btn" id="back">返回</button>
        <button class="btn btn-primary" id="next">开始测试</button>
      </div>
    </section>
  `;

  const ta = $('#diary');
  ta.value = draft.diary || '';

  const refresh = () => {
    $('#count').textContent = String((ta.value||'').trim().length);
    const norm = normalizeIntensity(draft.intensity, ta.value);
    $('#int').textContent = norm.intensity;
    if(norm.forced){
      $('#riskHint').style.display = 'block';
      $('#riskHint').innerHTML = `<span class="danger">检测到高风险词：${norm.riskWord}</span>。我们已自动切换为温和模式。若你正感到不安全，请立即联系身边的人/当地求助热线。`;
    }else{
      $('#riskHint').style.display = 'none';
    }
  };
  refresh();
  ta.oninput = refresh;

  $('#back').onclick = ()=> location.hash = '#/';
  $('#next').onclick = ()=>{
    const text = (ta.value||'').trim();
    if(text.length < 20){
      toast('再写多一点点（至少 20 字），不然故事会太空。');
      return;
    }
    draft.diary = text;
    const norm = normalizeIntensity(draft.intensity, text);
    draft.intensity = norm.intensity;
    draft.forcedGentle = norm.forced;
    draft.stage = 'test';
    saveDraft(draft);
    location.hash = '#/test';
  };
}

function renderTest(app){
  const draft = loadDraft();
  if(!draft?.diary) return (location.hash = '#/diary');
  draft.stage = 'test';
  saveDraft(draft);

  const test = draft.test || { q1:null, q2:null, q3:null };

  app.innerHTML = `
    <section class="card">
      <div class="hd">
        <h2>Step 2 · 恐怖意象测试（3题）</h2>
        <p class="muted">凭直觉选择，不需要“想对”。你的选择会塑造故事的气质。</p>
      </div>
      <div class="bd">
        ${renderQuestion(1,'在黑暗中，你遇到了一个身影。TA是：',[
          {k:'A',t:'一个与你长得一模一样的人，但眼神空洞',sub:'整合者 · 与阴影共存'},
          {k:'B',t:'一个不断哭泣的小孩，向你伸出手',sub:'守护者 · 保护本能'},
          {k:'C',t:'一个看不清面容的陌生人，静静站立',sub:'分析者 · 理性洞察'},
        ], test.q1)}

        <div class="hr"></div>

        ${renderQuestion(2,'你发现自己被困在：',[
          {k:'A',t:'一条没有尽头的走廊，两侧都是关闭的门',sub:'无尽走廊 · 孤立/等待'},
          {k:'B',t:'四面都是镜子的房间，每面镜子里的你都不同',sub:'镜像房间 · 自我怀疑'},
          {k:'C',t:'不断崩塌的迷宫，墙壁在移动变化',sub:'崩塌迷宫 · 失控/焦虑'},
        ], test.q2)}

        <div class="hr"></div>

        ${renderQuestion(3,'你手中握着一件物品，它是：',[
          {k:'A',t:'一把生锈的钥匙，打不开任何门，但你无法放下',sub:'钥匙 · 被困/绝望 → 转化的线索'},
          {k:'B',t:'一本写满字但看不清内容的日记，封面上是你的名字',sub:'日记 · 秘密/暴露 → 自我接纳'},
          {k:'C',t:'一只停止走动的手表，指针指向你记不清的时间',sub:'手表 · 时间/死亡 → 当下力量'},
        ], test.q3)}
      </div>
      <div class="ft">
        <button class="btn" id="back">返回</button>
        <button class="btn btn-primary" id="next">生成配置</button>
      </div>
    </section>
  `;

  bindQuestion(1, (k)=>{ test.q1=k; saveDraft({ ...draft, test }); });
  bindQuestion(2, (k)=>{ test.q2=k; saveDraft({ ...draft, test }); });
  bindQuestion(3, (k)=>{ test.q3=k; saveDraft({ ...draft, test }); });

  // restore selected state
  ['q1','q2','q3'].forEach((q,idx)=>{
    const v = test[q];
    if(v){
      const el = document.querySelector(`[data-q="${idx+1}"][data-k="${v}"]`);
      if(el) el.classList.add('selected');
    }
  });

  $('#back').onclick = ()=> location.hash = '#/diary';
  $('#next').onclick = ()=>{
    if(!test.q1 || !test.q2 || !test.q3){
      toast('三题都选完再继续。');
      return;
    }
    draft.test = test;
    draft.stage = 'config';
    saveDraft(draft);
    location.hash = '#/config';
  };
}

function renderQuestion(n, title, opts, selected){
  const items = opts.map(o=>`
    <div class="option" data-q="${n}" data-k="${o.k}">
      <div><span class="k">${o.k}</span>${o.t}</div>
      <div class="muted small">${o.sub}</div>
    </div>
  `).join('');
  return `
    <div>
      <h3>第${n}题：${title}</h3>
      <div class="list" style="margin-top:10px">${items}</div>
    </div>
  `;
}

function bindQuestion(n, onPick){
  $$(`[data-q="${n}"]`).forEach(el=>{
    el.onclick = ()=>{
      $$(`[data-q="${n}"]`).forEach(x=>x.classList.remove('selected'));
      el.classList.add('selected');
      onPick(el.getAttribute('data-k'));
    };
  });
}

function renderConfig(app){
  const draft = loadDraft();
  if(!draft?.diary || !draft?.test?.q1) return (location.hash = '#/diary');
  draft.stage = 'config';
  const config = computeStoryConfig(draft);
  draft.storyConfig = config;
  saveDraft(draft);

  const norm = normalizeIntensity(draft.intensity, draft.diary);

  app.innerHTML = `
    <section class="card">
      <div class="hd">
        <h2>Step 3 · 故事配置确认</h2>
        <p class="muted">确认你的恐惧档案。你可以回到上一页重新选择。</p>
      </div>
      <div class="bd">
        <div class="row">
          <div class="card" style="flex:1">
            <div class="hd"><h3>你的恐惧档案</h3></div>
            <div class="bd">
              <div class="badge gold">恐惧类型：${config.fearType}</div>
              <div style="height:10px"></div>
              <div class="badge">人物原型：${config.protagonistArchetype}</div>
              <div style="height:8px"></div>
              <div class="badge">恐怖场景：${config.horrorScenario}</div>
              <div style="height:8px"></div>
              <div class="badge">恐怖符号：${config.horrorSymbol}</div>
              <div style="height:8px"></div>
              <div class="badge">怪物原型：${config.monsterArchetype}</div>
              <div class="hr"></div>
              <div class="muted small">强度：<span class="kbd">${norm.intensity}</span>${norm.forced ? '（已自动降级）' : ''}</div>
            </div>
          </div>
          <div class="card" style="flex:1">
            <div class="hd"><h3>提示</h3></div>
            <div class="bd">
              <p class="muted">生成逻辑：CBT 五要素 → 五幕疗愈弧线 → 金钥匙行动。</p>
              <p class="muted small">这是离线原型：故事会基于模板与规则生成，后续可替换为大模型生成以提高多样性。</p>
              ${draft.forcedGentle ? `<p class="small danger">你写的内容包含高风险信号，我们已切换为温和模式，并建议你优先寻求现实支持。</p>` : ''}
            </div>
          </div>
        </div>
      </div>
      <div class="ft">
        <button class="btn" id="back">重新测试</button>
        <button class="btn btn-primary" id="go">生成故事</button>
      </div>
    </section>
  `;

  $('#back').onclick = ()=> location.hash = '#/test';
  $('#go').onclick = ()=> location.hash = '#/loading';
}

function renderLoading(app){
  const draft = loadDraft();
  if(!draft?.storyConfig) return (location.hash = '#/config');
  draft.stage = 'loading';
  saveDraft(draft);

  app.innerHTML = `
    <section class="card">
      <div class="hd">
        <h2>Step 4 · 故事生成中</h2>
        <p class="muted">正在将你的恐惧编织成故事……</p>
      </div>
      <div class="bd">
        <div class="row" style="align-items:center; gap:14px">
          <div class="key">🔑</div>
          <div style="flex:1">
            <div class="progress"><div id="bar"></div></div>
            <div class="muted small" id="msg" style="margin-top:10px">点亮烛火…</div>
          </div>
        </div>
      </div>
      <div class="ft">
        <button class="btn" id="cancel">取消</button>
      </div>
    </section>
  `;

  $('#cancel').onclick = ()=> location.hash = '#/config';

  const msgs = ['点亮烛火…','门在缓缓打开…','把情绪写进阴影…','让怪物有了形状…','寻找那把钥匙…','快完成了…'];
  let p = 0;
  const timer = setInterval(()=>{
    p += 8 + Math.random()*10;
    $('#bar').style.width = Math.min(100, p) + '%';
    $('#msg').textContent = msgs[Math.min(msgs.length-1, Math.floor(p/18))];
    if(p >= 100){
      clearInterval(timer);
      // generate story + golden key
      const config = draft.storyConfig;
      const story = genStory(config, draft.diary, draft.intensity);
      const key = genGoldenKey(config);
      draft.story = story;
      draft.goldenKey = key;
      draft.stage = 'story';
      saveDraft(draft);
      location.hash = '#/story';
    }
  }, 220);
}

function renderStory(app){
  const draft = loadDraft();
  if(!draft?.story) return (location.hash = '#/loading');
  draft.stage = 'story';
  saveDraft(draft);

  app.innerHTML = `
    <section class="card">
      <div class="hd">
        <h2>Step 5 · 故事阅读</h2>
        <p class="muted">故事结束了，但你的旅程才刚刚开始。</p>
      </div>
      <div class="bd">
        <div class="row" style="justify-content:space-between; align-items:center">
          <div>
            <div class="badge gold">${draft.story.title}</div>
            <div style="height:8px"></div>
            <div class="muted small">恐惧类型：${draft.storyConfig.fearType} · 强度：${draft.intensity}</div>
          </div>
          <div class="row" style="flex:0 0 auto">
            <button class="btn" id="copy">复制故事</button>
          </div>
        </div>
        <div class="hr"></div>
        <div class="story" id="story">${escapeHtml(draft.story.content)}</div>
      </div>
      <div class="ft">
        <button class="btn" id="back">返回配置</button>
        <button class="btn btn-primary" id="key">领取你的金钥匙</button>
      </div>
    </section>
  `;

  $('#copy').onclick = async ()=>{
    try{ await navigator.clipboard.writeText(draft.story.title + '\n\n' + draft.story.content); toast('已复制到剪贴板'); }
    catch{ toast('复制失败（浏览器权限限制）'); }
  };
  $('#back').onclick = ()=> location.hash = '#/config';
  $('#key').onclick = ()=> location.hash = '#/golden-key';
}

function renderGoldenKey(app){
  const draft = loadDraft();
  if(!draft?.goldenKey) return (location.hash = '#/story');
  draft.stage = 'golden-key';
  saveDraft(draft);

  const key = draft.goldenKey;

  app.innerHTML = `
    <section class="card">
      <div class="hd">
        <h2>Step 6 · 金钥匙</h2>
        <p class="muted">把启示带回现实。你不需要立刻变好，只要开始。</p>
      </div>
      <div class="bd">
        <div class="row" style="align-items:center; gap:14px">
          <div class="key">🔑</div>
          <div>
            <div class="badge gold">钥匙名称：${key.symbol}</div>
            <div class="muted small" style="margin-top:6px">揭示的核心信念：<span class="kbd">${key.coreBelief}</span></div>
          </div>
        </div>

        <div class="hr"></div>

        <div class="quote">${key.highlightQuote}</div>
        <p style="margin-top:12px">${key.interpretation}</p>

        <div class="hr"></div>

        <h3>3 条可执行建议</h3>
        <div class="list" style="margin-top:10px">
          ${key.actions.map((a,i)=>`<div class="option"><div><span class="k">${i+1}</span>${escapeHtml(a)}</div></div>`).join('')}
        </div>

        <div class="hr"></div>

        <h3>赋能肯定语</h3>
        <div class="option" style="margin-top:10px">
          <div class="story">${escapeHtml(key.affirmation)}</div>
        </div>

        <div class="hr"></div>
        <h3>情绪温度计</h3>
        <p class="muted small">给“阅读前/阅读后”的情绪强度打分（1-10）。</p>
        <div class="row">
          <div class="field">
            <div class="label">阅读前（1-10）</div>
            <input id="before" type="number" min="1" max="10" value="${draft.emotionBefore || 6}" />
          </div>
          <div class="field">
            <div class="label">阅读后（1-10）</div>
            <input id="after" type="number" min="1" max="10" value="${draft.emotionAfter || 4}" />
          </div>
        </div>

        <p class="muted small">免责声明：本产品为自我探索工具，不替代心理咨询/医疗建议。</p>
      </div>
      <div class="ft">
        <button class="btn" id="back">返回故事</button>
        <button class="btn" id="save">保存到档案</button>
        <button class="btn btn-danger" id="reset">清除本次草稿</button>
      </div>
    </section>
  `;

  $('#back').onclick = ()=> location.hash = '#/story';
  $('#save').onclick = ()=>{
    const before = clampInt($('#before').value, 1, 10);
    const after = clampInt($('#after').value, 1, 10);
    draft.emotionBefore = before;
    draft.emotionAfter = after;

    const records = loadRecords();
    const record = {
      id: draft.id,
      createdAt: draft.createdAt,
      savedAt: nowISO(),
      intensity: draft.intensity,
      endingPref: draft.endingPref,
      diary: draft.diary,
      test: draft.test,
      storyConfig: draft.storyConfig,
      story: draft.story,
      goldenKey: draft.goldenKey,
      emotionBefore: before,
      emotionAfter: after,
    };
    // upsert
    const idx = records.findIndex(r => r.id === record.id);
    if(idx >= 0) records[idx] = record; else records.unshift(record);
    saveRecords(records);
    toast('已保存到档案');
  };
  $('#reset').onclick = ()=>{
    if(confirm('确定清除本次草稿？（不会删除已保存的档案）')){
      clearDraft();
      toast('已清除草稿');
      location.hash = '#/';
    }
  };
}

function renderArchive(app){
  const records = loadRecords();

  app.innerHTML = `
    <section class="card">
      <div class="hd">
        <h2>恐惧档案</h2>
        <p class="muted">你走过的每一次夜路，都会留下微光。</p>
      </div>
      <div class="bd">
        ${records.length === 0 ? `<p class="muted">暂无记录。完成一次故事 + 金钥匙后，点击“保存到档案”。</p>` : ''}
        <div class="list" id="list">
          ${records.map(r=>archiveItem(r)).join('')}
        </div>
      </div>
      <div class="ft">
        <button class="btn" id="back">返回</button>
        ${records.length ? `<button class="btn btn-danger" id="wipe">清空档案</button>` : ''}
      </div>
    </section>
  `;

  $('#back').onclick = ()=> location.hash = '#/';
  if(records.length){
    $('#wipe').onclick = ()=>{
      if(confirm('确定清空全部档案？此操作不可恢复。')){
        saveRecords([]);
        toast('已清空');
        render();
      }
    };

    $$('#list .option').forEach(el=>{
      el.onclick = ()=>{
        const id = el.getAttribute('data-id');
        const rec = records.find(r=>r.id===id);
        if(!rec) return;
        // load into draft (readonly-ish)
        saveDraft({
          ...rec,
          stage:'story',
          id: rec.id,
          createdAt: rec.createdAt,
        });
        toast('已打开记录');
        location.hash = '#/story';
      };
    });
  }
}

function archiveItem(r){
  const delta = (r.emotionBefore && r.emotionAfter) ? (r.emotionAfter - r.emotionBefore) : null;
  const deltaText = delta === null ? '' : (delta <= 0 ? `改善 ${Math.abs(delta)}` : `变差 ${delta}`);
  return `
    <div class="option" data-id="${r.id}">
      <div class="row" style="justify-content:space-between; align-items:center">
        <div>
          <div><span class="k">${escapeHtml(r.story?.title || '故事')}</span> <span class="muted small">${escapeHtml(r.savedAt || r.createdAt)}</span></div>
          <div class="muted small">${escapeHtml(r.storyConfig?.fearType || '')} · ${escapeHtml(r.intensity || '')} · ${deltaText}</div>
        </div>
        <div class="badge gold">🔑 ${escapeHtml(r.goldenKey?.symbol || '')}</div>
      </div>
    </div>
  `;
}

function clampInt(v, min, max){
  const n = Math.round(Number(v || 0));
  if(Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function escapeHtml(str){
  return String(str||'')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function initAsh(){
  const a = $('#ash');
  const n = 90;
  const w = window.innerWidth, h = window.innerHeight;
  let html = '';
  for(let i=0;i<n;i++){
    const left = Math.random()*100;
    const top = Math.random()*100;
    const dur = 8 + Math.random()*16;
    const delay = -Math.random()*dur;
    const op = 0.15 + Math.random()*0.45;
    const size = 1 + Math.random()*2;
    html += `<span style="left:${left}%; top:${top}%; opacity:${op}; width:${size}px; height:${size}px; animation-duration:${dur}s; animation-delay:${delay}s"></span>`;
  }
  a.innerHTML = html;
}

// nav buttons
$('#btnArchive').onclick = ()=> location.hash = '#/archive';

window.addEventListener('hashchange', render);
window.addEventListener('resize', ()=>{ /* keep simple */ });

initAsh();
render();
