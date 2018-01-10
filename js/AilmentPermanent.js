class SkillAttachAilment extends Skill {
    constructor(skillName, ailmentName, ailments) {
        super(skillName);
        this.ailmentSet = new SkillSet(ailments, ailmentName);
    }

    apply(caster, target) {
        target.permanentAilment = this.ailmentSet;

        return `【${caster.name}】 の ${this.name}. 【${target.name}】 に ${this.ailmentSet.name}.`;
    }
}

class AilmentSetEmpty extends SkillSet {
    constructor() {
        const ailmentAffectNothing = new Skill('dummy');
        ailmentAffectNothing.apply = (caster, target) => { return null; };

        super([ailmentAffectNothing], 'dummyset');
    }
}

class AilmentRemove extends Skill {
    constructor(name) {
        super(name);
    }

    apply(caster, target) {
        caster.permanentAilment = new AilmentSetEmpty();

        return `【${caster.name}】 は状態異常から回復.`;
    }
}

class AilmentCancelAction extends Skill {
    constructor(name) {
        super(name);
    }

    apply(caster, target) {
        const ailment = new CancelAction();
        ailment.reset(1);

        caster.addTemporaryAilment(ailment);

        return null;
    }
}

class AilmentCancelSupport extends Skill {
    constructor(name) {
        super(name);
    }

    apply(caster, target) {
        const ailment = new CancelSupport();
        ailment.reset(1);

        caster.addTemporaryAilment(ailment);

        return null;
    }
}
