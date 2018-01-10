class AilmentTemporary {
    constructor(name, duration) {
        this.name = name;

        this.reset(0);
    }

    getId() {
        throw new Error('not implemented.');
    }

    reset(duration) {
        this.rest = duration;
    }

    tick(x) {
        if (this.rest > 0) {
            --this.rest;
        }
    }

    isActive() {
        return this.rest > 0;
    }
}

class Barrier extends AilmentTemporary {
    constructor() {
        super('攻撃無効');
    }

    getId() {
        return 'barrier';
    }
}

class CancelAction extends AilmentTemporary {
    constructor() {
        super('ダメージ不発');
    }

    getId() {
        return 'cancelAction';
    }
}

class CancelSupport extends AilmentTemporary {
    constructor() {
        super('ダメージ以外不発');
    }

    getId() {
        return 'cancelSupport';
    }
}
