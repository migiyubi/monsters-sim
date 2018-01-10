class Skill {
    constructor(name) {
        this.name = name;
    }

    apply(caster, target) {
        throw new Error('not implemented.');
    }
}

// TODO: this class does not implement "apply()", but acts as if it's concrete.
//       should define "AppliableSkill" or something?
class SkillSet extends Skill {
    constructor(skills, name) {
        super(name);
        this.skills = skills;
    }

    get(x) {
        const denormalizedX = x * this.skills.length;
        const index = denormalizedX | 0;
        const child = this.skills[index];

        if (child instanceof SkillSet) {
            const newNormalizedX = denormalizedX - index;
            return child.get(newNormalizedX);
        }
        else {
            return child;
        }
    }

    getTransforms() {
        return this.skills.filter((skill) => { return skill instanceof SkillTransform; });
    }
}

class SkillMiss extends Skill {
    constructor(name) {
        super(name);
    }

    apply(caster, target) {
        return `【${caster.name}】 の ${this.name}. ミス.`;
    }
}

class SkillAttack extends Skill {
    constructor(name, value) {
        super(name);
        this.value = value;
    }

    apply(caster, target) {
        if (caster.temporaryAilmentMap['cancelAction'] && caster.temporaryAilmentMap['cancelAction'].isActive()) {
            return `【${caster.name}】 の ${this.name} は不発.`;
        }

        if (target.temporaryAilmentMap['barrier'] && target.temporaryAilmentMap['barrier'].isActive()) {
            return `【${caster.name}】 の ${this.name}. 【${target.name}】 は攻撃を無効化.`;
        }

        const buffedValue = this.value + caster.buff;
        target.hp -= buffedValue;

        return `【${caster.name}】 の ${this.name}. 【${target.name}】 に ${buffedValue}(+${caster.buff}) のダメージ.`;
    }
}

class SkillSelfDestruct extends Skill {
    constructor(name, value) {
        super(name);
        this.value = value;
    }

    apply(caster, target) {
        const buffedValue = this.value + caster.buff;
        caster.hp -= buffedValue;

        return `【${caster.name}】 の ${this.name}. 【${caster.name}】 に ${this.value+caster.buff}(+${caster.buff}) のダメージ.`;
    }
}

class SkillAttackBoth extends Skill {
    constructor(name, value) {
        super(name);
        this.value = value;

        this.subSkillAttack = new SkillAttack(name, value);
        this.subSkillSelfDestruct = new SkillSelfDestruct(name, value);
    }

    apply(caster, target) {
        const logAttack = this.subSkillAttack.apply(caster, target);
        const logSelfDestruct = this.subSkillSelfDestruct.apply(caster, target);

        return `${logAttack} ${logSelfDestruct}`;
    }
}

class SkillBuff extends Skill {
    constructor(name, value) {
        super(name);
        this.value = value;
    }

    apply(caster, target) {
        if (caster.temporaryAilmentMap['cancelSupport'] && caster.temporaryAilmentMap['cancelSupport'].isActive()) {
            return `【${caster.name}】 の ${this.name} は不発.`;
        }

        caster.buff += this.value;

        return `【${caster.name}】 の ${this.name}. 【${caster.name}】 の攻撃力が ${this.value} 上がった.`;
    }
}

class SkillRestore extends Skill {
    constructor(name, value) {
        super(name);
        this.value = value;
    }

    apply(caster, target) {
        if (caster.temporaryAilmentMap['cancelSupport'] && caster.temporaryAilmentMap['cancelSupport'].isActive()) {
            return `【${caster.name}】 の ${this.name} は不発.`;
        }

        caster.hp = Math.min(caster.hp + this.value, caster.maxHp);

        return `【${caster.name}】 の ${this.name}. 【${caster.name}】 は ${this.value} 回復.`;
    }
}

class SkillBarrier extends Skill {
    constructor(name, duration) {
        super(name);
        this.duration = duration;
    }

    apply(caster, target) {
        const barrier = new Barrier();
        barrier.reset(this.duration);

        caster.addTemporaryAilment(barrier);

        return `【${caster.name}】 の ${this.name}. 【${caster.name}】 は ${this.duration} ターン攻撃無効.`;
    }
}

class SkillTransform extends Skill {
    constructor(name, targetName) {
        super(name);
        this.targetName = targetName;
    }

    // Note: 1st argument will be modified.
    apply(caster, target) {
        const transformTo = MonsterGenerator.getInstance().get(this.targetName);

        if (!transformTo) {
            throw new Error(`no such monster. : ${this.targetName}`);
        }

        const oldName = caster.name;
        caster.copy(transformTo);

        return `【${oldName}】 は 【${caster.name}】 に変身.`;
    }
}

class SkillTransformOpponent extends Skill {
    constructor(name) {
        super(name);
    }

    apply(caster, target) {
        const transformSkills = target.skillSet.getTransforms();

        if (transformSkills.length < 1) {
            return `【${caster.name}】 は変身に失敗.`;
        }
        else {
            // TODO: which transform should we choose?
            const t = transformSkills[Math.random()*transformSkills.length|0];
            const transformTo = MonsterGenerator.getInstance().get(t.targetName);

            const oldName = caster.name;
            caster.copy(transformTo);

            return `【${oldName}】 は 【${caster.name}】 に変身.`;
        }
    }
}

class SkillGacya extends Skill {
    constructor(name, value) {
        super(name);
        this.value = value;
    }

    apply(caster, target) {
        const buffedValue = this.value + caster.buff;
        caster.hp -= buffedValue;

        // TODO: should determine which case happens in upper layer.
        const r0 = (Math.random()*6|0)+1;
        const r1 = (Math.random()*6|0)+1;
        const r2 = (Math.random()*6|0)+1;
        let damage = 0;
        if (r0===6 && r1===6 && r2===6) {
            damage = 300;
        }
        else if (r0===r1 || r1===r2 || r2===r0) {
            damage = 60;
        }
        else if (r0===1 || r1===1 || r2===1) {
            damage = 30;
        }

        target.hp -= damage;

        return `【${caster.name}】 はガチャを回した. 出た目は ${r0},${r1},${r2}. 【${target.name}】 に ${damage} のダメージ.`;
    }
}
