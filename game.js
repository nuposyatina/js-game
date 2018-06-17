'use strict';
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }

    return new Vector(this.x + vector.x, this.y + vector.y);
  }
  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(pos instanceof Vector)) {
      throw new Error('Расположение должно быть объектом типа Vector');
    }

    if (!(size instanceof Vector)) {
      throw new Error('Размер должен быть объектом типа Vector');
    }

    if (!(speed instanceof Vector)) {
      throw new Error('Скорость должна быть объектом типа Vector');
    }
    this.pos = pos
    this.size = size;
    this.speed = speed;
  }

  act() {

  }

  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return 'actor';
  }

  isIntersect(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Должен быть объектом типа Actor');
    }
    if (actor === this) {
      return false;
    }
    return actor.bottom > this.top && actor.top < this.bottom && actor.left < this.right && actor.right > this.left;
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = this.actors.find(actor => actor.type === 'player');
    this.height = grid.length;
    // тут можно написать короче, если использовать стрелочную функцию
    this.width = grid.reduce((acc, el) => Math.max(acc, el.length), 0)
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Должен быть объектом типа Actor');
    }
    return this.actors.find(obj => actor.isIntersect(obj));
  }

  obstacleAt(pos, size) {
    if (!(pos instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Должен быть объектом типа Vector');
    }
    // если значение присваивается переменной один раз,
    // то лучше использовать const
    // не все округления тут корретные
    // попробуйте нарисовать игровое поле и объект который занимает несколько клеток,
    // а потом посмотреть какими должны быть граничные значения
    const left = Math.floor(pos.x);
    const right = Math.ceil(pos.x + size.x);
    const top = Math.floor(pos.y);
    const bottom = Math.ceil(pos.y + size.y);

    if (top < 0 || left < 0 || right > this.width) {
      return 'wall';
    }
    if (bottom > this.height) {
      return 'lava';
    }

    for (let i = top; i < bottom; i++) {
      for (let j = left; j < right; j++) {
        let obstacle = this.grid[i][j];
        // this.grid[j][i] лучше записать в переменную, чтобы 2 раза не писать
        if (obstacle) {
          return obstacle;
        }
      }
    }
  }

  removeActor(actor) {
    // const
    const index = this.actors.indexOf(actor);
    // если объект не будет найден, код отработает некорректно
    if (index !== -1) {
      this.actors.splice(index, 1);
    }

  }

  noMoreActors(type) {
    // тут лучше использовать метод some
    // и если выражение в if это true или false,
    // то можно писать сразу return <выражение>
    return !this.actors.some(actor => actor.type === type);
  }

  playerTouched(type, actor) {
    if (this.status !== null) {
      return;
    }

    if (type === 'lava' || type === 'fireball') {
      this.status = 'lost';
    }

    if (type === 'coin' && actor.type === 'coin') {
      this.removeActor(actor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor(dictionary = {}) {
    this.dictionary = dictionary;
  }

  actorFromSymbol(symbol) {
    return this.dictionary[symbol];
  }

  obstacleFromSymbol(symbol) {
    if (symbol === 'x') {
      return 'wall';
    }
    if (symbol === '!') {
      return 'lava';
    }
    // лишняя строчка
    return undefined;
  }

  createGrid(scheme) {
    // можно использовать короткую форму записи стрелочных функций
    // (без фигурных скобок и return)
    return scheme.map(row => row.split('').map(cell => this.obstacleFromSymbol(cell)));
  }

  createActors(scheme) {
    return scheme.reduce((result, row, y) => {
      row.split('').forEach((cell, x) => {
        const actor = this.actorFromSymbol(cell);
        if (typeof actor === 'function') {
          const instance = new actor(new Vector(x, y));
          if (instance instanceof Actor) {
            result.push(instance);
          }
        }
      });
      return result;
    }, []);
  }

  parse(scheme) {
    return new Level(this.createGrid(scheme), this.createActors(scheme));
  }
}

class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1, 1), speed);
  }
  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    let nextPosition = this.getNextPosition(time);
    if (level.obstacleAt(nextPosition, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = nextPosition;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
    this.init = pos;
  }
  handleObstacle() {
    this.pos = this.init;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector()) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.initPosition = pos.plus(new Vector(0.2, 0.1));
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.initPosition.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(1, 1)) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector());
  }

  get type() {
    return 'player';
  }
}

const actorDict = {
  '@': Player,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'v': FireRain
};
const parser = new LevelParser(actorDict);

loadLevels()
  .then(result => runGame(JSON.parse(result), parser, DOMDisplay))
  .then(() => alert('Поздравляю! Вы победили.'));