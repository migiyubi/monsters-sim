class Monster {
    constructor(name, skillSet, maxHp, image) {
        this.initialName = name;
        this.initialMaxHp = maxHp;
        this.initialSkillSet = skillSet;
        this.initialImage = image;
        this.name = null;
        this.maxHp = null;
        this.skillSet = null;

        this.hp = null;
        this.buff = null;
        this.permanentAilment = null;
        this.temporaryAilmentMap = null;

        this.reset(true);
    }

    // Note: hard reset will rollback all changes including transformations.
    //       soft reset will rollback only dynamic parameters except HP.
    reset(hard) {
        this.buff = 0;
        this.permanentAilment = new AilmentSetEmpty();
        this.temporaryAilmentMap = {};

        if (hard) {
            this.name = this.initialName;
            this.maxHp = this.initialMaxHp;
            this.skillSet = this.initialSkillSet;
            this.image = this.initialImage;
            this.hp = this.maxHp;
        }
    }

    copy(other) {
        this.name = other.name;
        this.maxHp = other.maxHp;
        this.skillSet = other.skillSet;
        this.image = other.image;

        this.hp = Math.min(this.hp, this.maxHp);

        this.reset(false);
    }

    getSkill(x) {
        return this.skillSet.get(x);
    }

    getPermanentAilment(x) {
        return this.permanentAilment.get(x);
    }

    tick(x) {
        for (const key in this.temporaryAilmentMap) {
            this.temporaryAilmentMap[key].tick(x);
        }
    }

    addTemporaryAilment(ailment) {
        this.temporaryAilmentMap[ailment.getId()] = ailment;
    }

    static loadFromJson(json) {
        return new Monster(
            json.name,
            Monster._loadSkillSetFromJson(json),
            json.max_hp,
            json.image
        );
    }

    static _loadSkillSetFromJson(json) {
        const skills = [];

        for (const child of json.skill_set) {
            skills.push(Monster._loadSkillFromJson(child));
        }

        return new SkillSet(skills, json.name);
    }

    static _loadSkillFromJson(json) {
        switch (json.type) {
            case 'attack'           : return new SkillAttack(json.name, json.value);
            case 'selfDestruct'     : return new SkillSelfDestruct(json.name, json.value);
            case 'attackBoth'       : return new SkillAttackBoth(json.name, json.value);
            case 'miss'             : return new SkillMiss(json.name);
            case 'buff'             : return new SkillBuff(json.name, json.value);
            case 'restore'          : return new SkillRestore(json.name, json.value);
            case 'barrier'          : return new SkillBarrier(json.name, json.duration);
            case 'special'          : return Monster._loadSkillSetFromJson(json);
            case 'transform'        : return new SkillTransform(json.name, json.target_name);
            case 'transformOpponent': return new SkillTransformOpponent(json.name);
            case 'gacya'            : return new SkillGacya(json.name, json.value);
            case 'attach_ailment'   : return Monster._loadAttachAilmentFromJson(json);
            default: console.warn('unknown skill type.', json.type); return null;
        }
    }

    static _loadAttachAilmentFromJson(json) {
        const ailments = [];

        for (const child of json.ailment_set) {
            ailments.push(Monster._loadAilmentFromJson(child));
        }

        return new SkillAttachAilment(json.name, json.ailment_name, ailments);
    }

    static _loadAilmentFromJson(json) {
        switch (json.type) {
            case 'remove'        : return new AilmentRemove(json.name);
            case 'cancel_action' : return new AilmentCancelAction(json.name);
            case 'cancel_support': return new AilmentCancelSupport(json.name);
            default: console.warn('unknown ailment type.', json.type); return null;
        }
    }

}

class MonsterGenerator {
    constructor() {
        this.monsterMap = {};
    }

    static getInstance() {
        if (window._monsterGeneratorInstance === undefined) {
            window._monsterGeneratorInstance = new MonsterGenerator();
        }

        return window._monsterGeneratorInstance;
    }

    static async _fetchJson(url) {
        const response = await fetch(url, { method: 'GET' });
        return response.json();
    }

    async init(urls, dir = '') {
        const promises = [];
        for (const url of urls) {
            promises.push(MonsterGenerator._fetchJson(`${dir}${url}`));
        }

        const jsons = await Promise.all(promises);

        for (const json of jsons) {
            this.monsterMap[json.name] = Monster.loadFromJson(json);
        }
    }

    get(name) {
        return this.monsterMap[name];
    }
}
