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
  constructor(grid, actors) {
    this.grid = grid;
    this.actors = actors;
    this.player = this.actors.find(actor => actor.type === 'player');
    this.height = grid.length;
    this.width = grid.reduce(function (acc, el) {
      return Math.max(acc, el.length)
    }, 0)
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
    let left = Math.floor(pos.x);
    let right = Math.ceil(pos.x + size.x);
    let top = Math.floor(pos.y);
    let bottom = Math.ceil(pos.y + size.y);

    if (top < 0 || left < 0 || right > this.width) {
      return 'wall';
    }
    if (bottom > this.height) {
      return 'lava';
    }

    for (i = top; i < bottom; i++) {
      for (j = left; j < right; j++) {
        if (this.grid[j][i]) {
          return this.grid[j][i];
        }
      }
    }
  }

  removeActor(actor) {
    let index = this.actors.indexOf(actor);
    this.actors.splice(index, 1);
  }

  noMoreActors(type) {
    if (!(this.actors.find(actor => actor.type === type))) {
      return true;
    }
    return false;
  }

  playerTouched(type, actor) {
    if (this.status !== null) {
      return;
    }

    if (type === 'lava' || type === 'fireball') {
      this.status === 'lost';
      return;
    }

    if (type === 'coin' && actor.type === 'coin') {
      this.removeActor(actor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}

