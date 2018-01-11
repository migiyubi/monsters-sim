class Simulator {
    constructor(debug = false) {
        this.debug = debug;
    }

    execute(monster0, monster1, iterations) {
        const d = this.debug;

        let monster0Wins = 0;

        for (let i = 0; i < iterations; i++) {
            let caster = i%2===0 ? monster0 : monster1;
            let target = i%2===0 ? monster1 : monster0;
            let turns = 0;

            caster.reset(true);
            target.reset(true);

            for (let turn = 0; ; turn++) {
                const r = Math.random();

                caster.tick(r);

                const ailment = caster.getPermanentAilment(r);
                const logAilment = ailment.apply(caster, target);

                const skill = caster.getSkill(r);
                const logSkill = skill.apply(caster, target);

                if (d) {
                    if (logAilment) console.log(logAilment);
                    console.log(`${turn}: ${logSkill}`, monster0.hp, monster1.hp);
                }

                if (caster.hp <= 0) {
                    if (target === monster0) {
                        ++monster0Wins;
                    }

                    if (d) {
                        console.log(`${target.name} の勝ち`);
                    }

                    break;
                }
                else if (target.hp <= 0) {
                    if (caster === monster0) {
                        ++monster0Wins;
                    }

                    if (d) {
                        console.log(`${caster.name} の勝ち`);
                    }

                    break;
                }

                const tmp = caster;
                caster = target;
                target = tmp;
            }
        }

        monster0.reset(true);
        monster1.reset(true);

        return monster0Wins;
    }
}

class Renderer {
    constructor(precision = 3, container = document.body) {
        this.precision = precision;
        this.container = container;
        this.cellElements = [];
        this.cellStride = 0;
    }

    init(monsters) {
        this.cellStride = monsters.length;

        const table = document.createElement('table');

        // header.
        const tr = document.createElement('tr');
        tr.appendChild(document.createElement('th'));
        for (const monster of monsters) {
            const th = document.createElement('th');
            th.textContent = monster.name;
            tr.appendChild(th);
        }
        table.appendChild(tr);

        // contents.
        for (const [row, monster] of monsters.entries()) {
            const tr = document.createElement('tr');

            // first column.
            const th = document.createElement('th');
            if (monster.image) {
                th.style.backgroundImage = `url(data:image/unknown;base64,${monster.image})`;
            }
            th.textContent = monster.name;
            tr.appendChild(th);

            // place holders.
            for (let col = 0; col < this.cellStride; col++) {
                const td = document.createElement('td');
                if (row !== col) {
                    td.textContent = '-';
                }
                tr.appendChild(td);

                this.cellElements[row*this.cellStride+col] = td;
            }

            table.appendChild(tr);
        }

        this.container.appendChild(table);
    }

    update(index0, index1, rate) {
        const cell0 = this.cellElements[index0*this.cellStride+index1];
        const cell1 = this.cellElements[index1*this.cellStride+index0];
        cell0.textContent = rate.toFixed(this.precision).slice(1);
        cell1.textContent = (1.0-rate).toFixed(this.precision).slice(1);

        if (rate > 0.5) {
            cell0.classList.add('advantage');
            cell1.classList.add('disadvantage');
        }
        else {
            cell0.classList.add('disadvantage');
            cell1.classList.add('advantage');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const main = async () => {
        const DEBUG = false;
        const ITERATIONS = 10000;

        const simulator = new Simulator(DEBUG);
        const renderer = new Renderer();
        const monsterUrls = [
            'Janken.json',
            'IkiriKamakiri.json',
            'MajuHomerun.json',
            'Fukie.json',
            'FukieLittleGod.json',
            'FukieAchievedObjective.json',
            'GacyaMachine10.json',
            'TakamineMadoka.json',
            'TakamineMadokaMartiel.json',
            'TakamineMadokaMastema.json',
            'NazoTamago.json',
            'NazoTamagoFish.json',
            'NazoTamagoAmphibian.json',
            'NazoTamagoMammal.json',
            'NazoTamagoGod.json',
            'NazoTamagoNeet.json',
            'NazoTamagoChief.json',
            'NazoTamagoSalaryman.json',
            'NazoTamagoKing.json',
            'PaladinKnightChan.json',
            'ImoDra.json',
        ];
        const entriedNames = [
            'ジャン・ケン',
            'イキリカマキリ',
            '魔獣のホームラン王',
            '山菜採りの主婦ふきゑ',
            '新春ガチャガチャマシーンVer1.0',
            '高峯　円（まどか）',
            '謎の卵',
            '聖騎士ナイトちゃん',
            'イモクイマクリドラゴン',
        ];

        const gen = MonsterGenerator.getInstance();
        await gen.init(monsterUrls, './monsters/');

        const entriedMonsters = [];
        for (const name of entriedNames) {
            entriedMonsters.push(gen.get(name));
        }

        renderer.init(entriedMonsters);

        const applyCombinations = (monsters, iterations, index0, index1) => {
            index0 = (index0 !== undefined) ? index0 : 0;
            index1 = (index1 !== undefined) ? index1 : 1;

            if (index0 >= monsters.length-1) {
                // finish.
                return;
            }

const t0 = Date.now();
            const monster0Wins = simulator.execute(monsters[index0], monsters[index1], iterations);
const t1 = Date.now();

            renderer.update(index0, index1, monster0Wins/iterations);

            const log = `${monsters[index0].name} vs ${monsters[index1].name} -> ${monster0Wins}:${iterations-monster0Wins} (${t1-t0}[ms])`;
            console.log(log);

            if (++index1 >= monsters.length) {
                index1 = ++index0 + 1;
            }

            setTimeout(() => { applyCombinations(monsters, iterations, index0, index1); }, 0);
        };

        applyCombinations(entriedMonsters, ITERATIONS);
    };

    main();
});
