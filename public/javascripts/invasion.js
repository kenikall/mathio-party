$(document).ready(function(){
  loadGame();
})

// declare all object types
var cow, players, beams, question1, question2, answer1, answer2;

var playerOneScore = 0;
var playerTwoScore = 0;

// cow movement parameters
var cowValues = [];
var questions = [];
var startingCows = 4;
var timer = 0;
setInterval(function(){ timer = timer + 1 }, 1000);
var cowSpeedOptions = [100, -100, 150, -150];
var cowMovementIntervals = [2, 3, 4];
function setCowSpeed(){
  cow.forEach(function(c){ c.speed = cowSpeedOptions[Math.floor(Math.random()*cowSpeedOptions.length)] })
}
setInterval(setCowSpeed, 1000);

// locations
var player1Location, player2Location, beamPosition;

// sounds
var moo;

// declare static assets
var assets = [
  ["background", "/images/invasion/farm.png"],
  ['ufo1', '/images/invasion/ufo1.png'],
  ['ufo2', '/images/invasion/ufo2.png'],
  ['beam', '/images/invasion/beam.png']
];

for (var i = 0; i <= 10; i++) {
  assets.push(['cowL' + i, '/images/invasion/cowL' + i + '.png']);
  assets.push(['cowR' + i, '/images/invasion/cowR' + i + '.png']);
};

// add game window to page
var loadGame = function(){
  $('#invasion').html('');
  game = new Phaser.Game(1000, 600, Phaser.AUTO, 'invasion', {preload: preload, create: create, update: update});
};

// load static assets
function preload() {
  assets.forEach(function(asset){
    var name = asset[0];
    var location = asset[1];
    game.load.image(name, location);
    game.load.audio('moo', '/sounds/invasion_sounds/Moo.wav');
  });
};

function create(){
  // add background to the game
  game.add.tileSprite(0, 0, 1000, 600, 'background');

  // add sounds
  moo = game.add.audio('moo');

  // add physics engine
  game.physics.startSystem(Phaser.Physics.ARCADE);

  // create cow group
  cow = game.add.group();
  cow.enableBody = true;
  // spawn starting cows
  for (var i = 0; i < startingCows; i++){
    spawnCow();
  }

  // make the two starting equations
  generateQuestion1();
  generateQuestion2();

  // display question1 and question2
  displayPlayerInfo();

  // create the players
  players = game.add.group();
  players.enableBody = true;
  createPlayer1(180, 10, 'ufo1');
  createPlayer2(680, 10, 'ufo2');

  // add beams group
  beams = game.add.group();

  //keyboard input
  keyboardInput = game.input.keyboard.createCursorKeys();
  one = game.input.keyboard.addKey(Phaser.Keyboard.ONE);
  two = game.input.keyboard.addKey(Phaser.Keyboard.TWO);
  three = game.input.keyboard.addKey(Phaser.Keyboard.THREE);

  // game over text
  finalScoreText = game.add.text(200, 400, '', { font: '50px Arial', fill: 'black', align: 'left'});
};

function update(){
  removeBeams();
  playerMovement();
  playerBeam();
  moveCow();
  removeCow();
  endGame();
  if (cowValues.length < 3) {
    spawnCow();
  }

  game.physics.arcade.overlap(players, cow, captureCow, null, this);
};

// create a cow
function spawnCow(){
  if (cowValues.length < 4){
    var x = Math.random()*(game.width - 100);
    var y = Math.random()*(game.height/2) + game.height* 0.3;
    var randomValue = Math.floor( Math.random() * 11 );
    var newCow = cow.create(x, y, 'cowL' + randomValue);
    newCow.value = randomValue;
    cowValues.push(newCow.value);
    newCow.speed = cowSpeedOptions[Math.floor(Math.random()*cowSpeedOptions.length)];
    newCow.interval = cowMovementIntervals[Math.floor(Math.random()*cowMovementIntervals.length)];
    newCow.body.collideWorldBounds = true;
    newCow.area = newCow.getBounds();
  };
};

// create a cow with set parameters
function spawnSpecificCow(x, y, value, image, speed, interval){
  var newCow = cow.create(x, y, image);
  newCow.value = value;
  newCow.speed = speed;
  newCow.interval = interval;
  newCow.body.collideWorldBounds = true;
  newCow.area = newCow.getBounds();
  return newCow;
};

function createPlayer1(x, y, id){
  var player = players.create(x, y, id);
  player.player_id = id;
}

function createPlayer2(x, y, id){
  var player = players.create(x, y, id);
  player.player_id = id;
}

function playerMovement(){
  players.forEach(function(p){
    if (p.player_id === 'ufo1'){
      p.body.velocity.x = 0;
      if(keyboardInput.left.isDown){
        p.body.velocity.x = -200;
      }else if(keyboardInput.right.isDown){
        p.body.velocity.x = 200;
      };
    };
    if (p.player_id === 'ufo2'){
      p.body.velocity.x = 0;
      if(one.isDown){
        p.body.velocity.x = -200;
      }else if(three.isDown){
        p.body.velocity.x = 200;
      };
    };
  });
};

function playerBeam(){
  players.forEach(function(p){
    if (p.player_id === 'ufo1'){
      if(keyboardInput.down.isDown){
        shootBeam(p.position.x, p.player_id)
      }
    };
    if (p.player_id === 'ufo2'){
      if(two.isDown){
        shootBeam(p.position.x, p.player_id)
      }
    };
  });
};

function removeBeams(){
  beams.forEach(function(b){
    if (b){
      b.kill();
      b.destroy();
      beamPosition = null;
    }
  });
};

function shootBeam(x, id){
  if (id === 'ufo1'){
    var beam = beams.create(x - 39, 120, 'beam');
  } else if (id === 'ufo2'){
    var beam = beams.create(x -35, 120, 'beam');
  };
  beam.alpha = 0.4;
  beamPosition = x;
};

function moveCow(){
  cow.forEach(function(c){
    if (c.recentTurn != timer){
      c.body.velocity.x = 0;
      // move cow vertically if hit with a beam
      if (beamPosition &&
        beamPosition < c.position.x &&
        c.position.x < (beamPosition + 100) ){
          c.body.velocity.y = -200;
          moo.play();
      // move cow horizontally at intervals
      } else if (timer % c.interval == 0) {
        c.body.velocity.x = c.speed;
        // change the cow image so they face the direction they move in
        if (c.speed > 0) {
          direction = 'cowR';
        } else {
          direction = 'cowL';
        };
        var newCow = spawnSpecificCow(c.x, c.y, c.value, direction + c.value, c.speed, c.interval);
        newCow.body.velocity.x = c.speed;
        newCow.body.velocity.y = c.body.velocity.y;
        newCow.recentTurn = timer;
        c.kill();
        c.destroy();
      };
    };
  });
};

// destroy cows that float to the top of the screen
function removeCow() {
  cow.forEach(function(c){
    if (c.position.y < 5){
      // remove the cow's value from the cowValue array
      removeCowValue(c.value);
      // make a new question if the cow answered one of the questions
      refreshQuestions(cow);
      // destroy the cow object
      c.kill();
      c.destroy();
      // make a new cow object after 2.5 seconds
      setTimeout( spawnCow, 2500 );
    };
  });
};

// destroy cows that collide with players
function captureCow(player, cow) {
  // increment the player score when they capture the correct cow
  changeScore(player, cow);
  // remove the cow's value from the cowValue array
  removeCowValue(cow.value);
  // make a new question if the cow answered one of the questions
  refreshQuestions(cow);
  // destroy the cow object
  cow.kill();
  cow.destroy();
  // make a new cow object after 2.5 seconds
  setTimeout( spawnCow, 2500 );
};

// make a new question when a cow that answers a question is destroyed
function refreshQuestions(cow){
  if (cow.value == questions[0][2]){
    questions.shift();
    generateQuestion1();
    displayPlayerInfo();
  }
  if (cow.value == questions[1][2]){
    questions.pop();
    generateQuestion2();
    displayPlayerInfo();
  };
};

function generateQuestion1(){
  questions.unshift(generateEquation());
  assignQuestion1();
};

function generateQuestion2(){
  questions.push(generateEquation());
  assignQuestion2();
};

// make an equation which solves to a cow value
function generateEquation(){
  var answer = cowValues[Math.floor(Math.random()*cowValues.length)];
  var invalid = true;
  // ensure that y is a positive number
  while(invalid){
    var x = Math.floor(Math.random() * 5);
    var y = answer - x;
    if (y >= 0) {
      invalid = false;
    };
  };
  // save the answers
  var answers = x + y;
  // return the question data
  return [x, y, answer];
};

function displayPlayerInfo(){
  $('.equation').remove();
  $('.invasion-questions').append('<div class="p1 equation"></div>');
  $('.invasion-questions').append('<div class="p2 equation"></div>');
  $('.p1').append('<p> Question: ' + question1 + '</p>');
  $('.p2').append('<p> Question: ' + question2 + '</p>');
  $('.p1').append('<p> Score: ' + playerOneScore + '</p>');
  $('.p2').append('<p> Score: ' + playerTwoScore + '</p>');
};

function assignQuestion1(){
  question1 = questions[0][0] + " + " + questions[0][1]
  answer1 = questions[0][2]
};

function assignQuestion2(){
  question2 = questions[1][0] + " + " + questions[1][1]
  answer2 = questions[1][2]
};

function removeCowValue(value){
  // get the index of the value in the cowValues array
  var index = cowValues.findIndex(function(element){
    if(element == value){
      return true;
    };
  });
  // remove the input value from the cowValues array
  cowValues.splice(index, 1);
};

function changeScore(player, cow){
  if (player.player_id === 'ufo1'){
    if (cow.value == questions[0][2]){
      playerOneScore++;
    };
  } else if (player.player_id === 'ufo2') {
    if (cow.value == questions[1][2]){
      playerTwoScore++;
    };
  };
};

function endGame(){
  if (playerOneScore >= 10 || playerTwoScore >= 10){
    players.forEach(function(p){
      p.body.velocity.y = -20;
    });

    var winner;
    if (playerOneScore > playerTwoScore){
      winner = 'Player 1'
    } else {
      winner = 'Player 2'
    }
    finalScoreText.text = 'Game over, ' + winner +  ' wins!'
  }
}
