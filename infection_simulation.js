/*jshint esversion: 6 */

/**
 * TODO LIST
 *
 * simulation
 * TODO: Grouping (boundaries are same thing?)
 * TODO: Travel
 * TODO: Boundaries, maybe user drawn or somehow randomly generated in interesting way
 * TODO: find way to fix the fact that virus can only spread to adjacent stops exponential growth, maybe with a spread radius variable
 *
 * TODO: Dead people fade away
 *
 * settings UI
 * TODO: Clean up
 */

/**
 * Initialize Variables
 */

// simulation variables
var population_size = 2500; // have default value be square number to fill nicely
var start_infected_chance = 0.05;
var infection_chance = 0.05;
var death_chance = 0.003;
var immune_develop_num = 50;
var persons = [];
var side_size = Math.ceil(Math.sqrt(population_size));
var num_infected = 0;
var immune_infect_others = true;
var immune_recover = true;
var develop_immunity = true;
var time_to_recover = 40;
var sim_spd = 5;
var percent_empty = 0.5;
var max_distance = 70;
var walls = false;
var movechance = 0.2;
var death_wait = 100;

// colors
var dead_color = "rgb(165, 36, 61)";
var immune_color = "rgb(185, 207, 212)";
var infected_color = "rgb(180, 130, 145)";
var healthy_color = "rgb(122, 183, 115)";

//UI
var show_graph = true;
if (document.getElementById("chart-container").style.display == "none") {
  show_graph = false;
} else {
  show_graph = true;
}

var totalDead = 0;

/**
 * Initialize Inputs
 */

// set html values to default values specified above
document.getElementById("inf_input").value = infection_chance * 100;
document.getElementById("in_inf_input").value = start_infected_chance * 100;
document.getElementById("death_input").value = death_chance * 100;
document.getElementById("imm_input").value = immune_develop_num;
document.getElementById("imm_infect").checked = immune_infect_others;
document.getElementById("imm_recover").checked = immune_recover;
document.getElementById("dev_imm").checked = develop_immunity;
document.getElementById("imm_recover_time").value = time_to_recover;
document.getElementById("sim_spd_input").value = sim_spd;
document.getElementById("pop_size_input").value = population_size;

// setup buttons
var startButton = document.getElementById("start_btn");
startButton.onclick = start;

var stopButton = document.getElementById("stop_btn");
stopButton.onclick = stop;

var settingsButton = document.getElementById("set_btn");
settingsButton.onclick = applySettings;

var infectButton = document.getElementById("inf_btn");
infectButton.onclick = doTimestep;

/**
 * Applies settings from html inputs into backend
 */
function applySettings() {
  stop();
  infection_chance = document.getElementById("inf_input").value / 100;
  start_infected_chance = document.getElementById("in_inf_input").value / 100;
  death_chance = document.getElementById("death_input").value / 100;
  immune_develop_num = document.getElementById("imm_input").value;
  immune_infect_others = document.getElementById("imm_infect").checked;
  immune_recover = document.getElementById("imm_recover").checked;
  develop_immunity = document.getElementById("dev_imm").checked;
  time_to_recover = document.getElementById("imm_recover_time").value;
  sim_spd = document.getElementById("sim_spd_input").value;
  population_size = document.getElementById("pop_size_input").value;
  side_size = Math.ceil(Math.sqrt(population_size));

  time = 0;
  arrx.length = 0;

  arrys[0].length = 0;
  arrys[1].length = 0;
  arrys[2].length = 0;
  arrys[3].length = 0;

  populate();

  allStatistics = [
    getTotals().infected,
    getTotals().immune,
    getTotals().healthy,
    totalDead,
  ];
  barChart.data.datasets[0].data = allStatistics;

  barChart.update();
  infChart.update();
}

/**
 * Setup Chart
 */
var inf = document.getElementById("infectedChart").getContext("2d");
var time = 0; // current x value
var arrx = []; // x data array
var arrys = [[], [], [], []]; // y value data arrays

var infChart = new Chart(inf, {
  type: "line",
  data: {
    labels: arrx,
    datasets: [
      {
        // infected population
        label: "Infected Population",
        data: arrys[0],
        borderWidth: 1,
        backgroundColor: infected_color,
      },
      {
        // immune population
        label: "Recovering Population",
        data: arrys[2],
        backgroundColor: immune_color,
      },
      {
        // dead population
        label: "Dead Population",
        data: arrys[1],
        backgroundColor: dead_color,
      },
      {
        // healthy population
        label: "Healthy Population",
        data: arrys[3],
        backgroundColor: healthy_color,
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    responsive: true,
    legend: {
      labels: {
        // This more specific font property overrides the global property
        fontColor: "white",
      },
    },
    elements: {
      point: {
        // backgroundColor: 'rgba(0,0,0,0)'
        radius: 0,
        borderWidth: 0,
        hitRadius: 10,
      },
    },
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
          stacked: true,
          display: false,
        },
      ],
      xAxes: [
        {
          display: false,
        },
      ],
    },
    animation: {
      duration: 0, // general animation time
    },
    hover: {
      animationDuration: 0, // duration of animations when hovering an item
    },
    responsiveAnimationDuration: 0, // animation duration after a resize
  },
});

var ctx = document.getElementById("barChart").getContext("2d");
var allStatistics = [2, 4, 6, 8];

var barChart = new Chart(ctx, {
  type: "bar",
  data: {
    // labels:['uno', 'dos','tres','quatro'], //displays data funky
    labels: ["Infected", "Recovering", "Healthy", "Dead"],
    datasets: [
      {
        label: "Population Totals",
        data: allStatistics,
        backgroundColor: [
          infected_color,
          immune_color,
          healthy_color,
          dead_color,
        ],
      },
    ],
  },

  options: {
    responsiveAnimationDuration: 0, // animation duration after a resize
    responsive: true,
    maintainAspectRatio: false,

    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
            max: population_size,
          },
        },
      ],
    },

    legend: {
      display: false,
      labels: {
        // This more specific font property overrides the global property
        fontColor: "white",
      },
    },

    animation: {
      duration: 1, // general animation time
    },
    hover: {
      animationDuration: 1, // duration of animations when hovering an item
    },
  },
});

/**
 * Sets up graph for the first time by pushing initial values
 */
function setupGraphs() {
  // for (i = 0; i < 100; i++) {
  //   arrx.push(null);
  //   arrys[0].push(null);
  //   arrys[1].push(null);
  //   arrys[2].push(null);
  //   arrys[3].push(null);
  //   console.log(i);
  // }

  for (i = 1; i < 100; i++) {
    arrx.push(null);
    arrys[0].push(null);
    arrys[1].push(null);
    arrys[2].push(null);
    arrys[3].push(null);
  }

  arrys[0].push(getTotals().infected);
  arrys[1].push(getTotals().dead);
  arrys[2].push(getTotals().immune);
  arrys[3].push(getTotals().healthy);

  allStatistics = [
    getTotals().infected,
    getTotals().immune,
    getTotals().healthy,
    getTotals().dead,
  ];
  barChart.data.datasets[0].data = allStatistics;

  barChart.update();
  infChart.update();
}

function graphStuff() {
  arrx.push(time);
  time++;

  if (show_graph) {
    //For line graph
    if (time < 100) {
      arrys[0].splice(time, 0, getTotals().infected);
      arrys[1].splice(time, 0, getTotals().dead);
      arrys[2].splice(time, 0, getTotals().immune);
      arrys[3].splice(time, 0, getTotals().healthy);
      arrys[0].pop();
      arrys[1].pop();
      arrys[2].pop();
      arrys[3].pop();
      graphResize();
    } else {
      arrys[0].push(getTotals().infected);
      arrys[1].push(getTotals().dead);
      arrys[2].push(getTotals().immune);
      arrys[3].push(getTotals().healthy);
      graphResize();
    }
    //Bar graph
    allStatistics = [
      getTotals().infected,
      getTotals().immune,
      getTotals().healthy,
      totalDead,
    ];
    barChart.data.datasets[0].data = allStatistics;

    infChart.update();
    barChart.update();
  }
}

function graphResize() {
  // arrx.push(time);
  // time++;

  // if (show_graph) {
  //   arrys[0].push(getTotals().infected);
  //   arrys[1].push(getTotals().dead);
  //   arrys[2].push(getTotals().immune);
  //   arrys[3].push(getTotals().healthy);
  //   infChart.update();
  //   graphResize();

  while (arrx.length > 100) {
    arrx.shift();
  }
  for (i = 0; i < 4; i++) {
    while (arrys[i].length > 100) {
      arrys[i].shift();
    }
  }
}

/**
 * Setup p5 stuff
 */

/**
 * Setup function that runs once to setup p5 stuff
 */
function setup() {
  let canvas = createCanvas(displayWidth / 3, displayWidth / 3);
  canvas.parent("canvascontainer");
  noStroke();
  background(220);
  noLoop();
  applySettings();
  setupGraphs();
}

/**
 * Draw function disabled with noLoop() in setup().
 */
function draw() {}

/**
 * Class to represent a person
 */
class Person {
  constructor(infected, xVel, yVel) {
    this.infected = infected; // If healthy, false
    this.immune = false;
    this.dead = false;

    this.deadtime = 0;
    this.survivedTime = 0;
    this.distance = 0;

    // random pos/neg velocities whos abs val adds to 1
    this.xVel = Math.random() * (Math.round(Math.random()) * 2 - 1);
    this.yVel = (1 - Math.abs(this.xVel)) * (Math.round(Math.random()) * 2 - 1);
  }
}

/**
 * Populates the p5 canvas with a new population based on settings
 */
function populate() {
  // populate persons array
  var temp_persons = [];

  // fill shoulder to shoulder
  // for (var x = 0; x < side_size; x++) {
  //   var temp_row = [];
  //   for (var y = 0; y < side_size; y++) {
  //     if (x * side_size + y < population_size) {
  //       if (Math.random() < start_infected_chance) {
  //         temp_row.push(new Person(true));
  //       } else {
  //         temp_row.push(new Person(false));
  //       }
  //     } else {
  //       temp_row.push(null);
  //     }
  //   }
  //   temp_persons.push(temp_row);
  // }

  // fill with spaces
  side_size = Math.ceil(side_size / (1 - percent_empty)); // make bigger

  // fill with null
  for (var x = 0; x < side_size; x++) {
    var temp_row = [];
    for (var y = 0; y < side_size; y++) {
      temp_row.push(null);
    }
    temp_persons.push(temp_row);
  }

  if (walls) {
    // add walls
    let wall_length = Math.floor(side_size * 0.1);
    // let walls_per_side = Math.floor(side_size * 0.1);
    let walls_per_side = 10;
    let dist_btw_walls = Math.floor(side_size / walls_per_side - 1);

    for (var i = 0; i < 4; i++) {
      //for each side

      if (i == 0) {
        //top
        startX = dist_btw_walls;
        startY = 0;
      } else if (i == 1) {
        //right
        startX = side_size - 1;
        startY = dist_btw_walls;
      } else if (i == 2) {
        //bottom
        startX = dist_btw_walls;
        startY = side_size;
      } else if (i == 3) {
        //left
        startX = 0;
        startY = Math.floor(1.5 * dist_btw_walls);
      }

      for (var j = 0; j < walls_per_side; j++) {
        //for each wall
        if (i == 0) {
          //if doing walls on top
          for (var k = 0; k < wall_length; k++) {
            temp_persons[startX][startY + k] = "wall";
          }
          startX = startX + dist_btw_walls;
        } else if (i == 1) {
          //if doing walls on right
          for (var k = 0; k < wall_length; k++) {
            temp_persons[startX - k][startY] = "wall";
          }
          startY = startY + dist_btw_walls;
        } else if (i == 2) {
          //walls on bottom
          for (var k = 0; k < wall_length; k++) {
            temp_persons[startX][startY - k] = "wall";
          }
          startX = startX + dist_btw_walls;
        } else if (i == 3) {
          //walls on left
          for (var k = 0; k < wall_length; k++) {
            temp_persons[startX + k][startY] = "wall";
          }
          startY = startY + dist_btw_walls;
        }
      }
    }
  }

  var placed = 0;
  while (placed < population_size) {
    var x = Math.floor(Math.random() * side_size);
    var y = Math.floor(Math.random() * side_size);
    if (temp_persons[x][y] == null) {
      // make person
      if (Math.random() < start_infected_chance) {
        temp_persons[x][y] = new Person(true);
      } else {
        temp_persons[x][y] = new Person(false);
      }
      placed++;
    }
  }

  persons = JSON.parse(JSON.stringify(temp_persons));
  drawPeople();
}

// sentinel variable to control animations
var do_animation = false;

/**
 * Starts infection animation
 */
function start() {
  do_animation = true;
  recursive_timestep();
}

/**
 * Stops infection animation and calculations
 */
function stop() {
  do_animation = false;
}

/**
 * Recursive helper for infection animation and calculations
 */
function recursive_timestep() {
  doTimestep();
  if (do_animation) {
    setTimeout(recursive_timestep, sim_spd);
  }
}

/**
 * Calculates one time step (infections, deaths, immunities, etc.)
 */
function doTimestep() {
  var temp_persons = JSON.parse(JSON.stringify(persons)); // Copy of persons

  for (var x = 0; x < persons.length; x++) {
    for (var y = 0; y < persons[0].length; y++) {
      if (persons[x][y] != null) {
        // if infected
        if (
          persons[x][y].infected &&
          !persons[x][y].dead &&
          (!persons[x][y].immune || immune_infect_others)
        ) {
          // infect others
          temp_persons = infectOthers(x - 1, y, temp_persons); // Left
          temp_persons = infectOthers(x + 1, y, temp_persons); // Right
          temp_persons = infectOthers(x, y - 1, temp_persons); // Up
          temp_persons = infectOthers(x, y + 1, temp_persons); // Down

          // effects of infection on person (death, immunity)
          temp_persons = applyInfection(x, y, temp_persons);
        }
        // if immune
        if (immune_recover && persons[x][y].immune) {
          temp_persons = applyRecovery(x, y, temp_persons);
        }

        if (!temp_persons[x][y].dead) {
          // move randomly
          // var randomnum = Math.random();
          // if (randomnum < 0.01) {
          //   temp_persons = movePerson(x, y, temp_persons, "right");
          // } else if (randomnum < 0.02) {
          //   temp_persons = movePerson(x, y, temp_persons, "left");
          // } else if (randomnum < 0.03) {
          //   temp_persons = movePerson(x, y, temp_persons, "up");
          // } else if (randomnum < 0.04) {
          //   temp_persons = movePerson(x, y, temp_persons, "down");
          // }

          if (persons[x][y].distance >= max_distance) {
            persons[x][y].distance = 0;
            persons[x][y].xVel =
              Math.random() * (Math.round(Math.random()) * 2 - 1);
            persons[x][y].yVel =
              (1 - Math.abs(persons[x][y].xVel)) *
              (Math.round(Math.random()) * 2 - 1);
          }

          if (Math.random() < movechance) {
            // move according to velocity
            var axis = pickPercent(
              [
                Math.abs(persons[x][y].xVel * 100),
                Math.abs(persons[x][y].yVel * 100),
              ],
              ["ud", "lr"]
            );

            if (axis == "ud") {
              if (persons[x][y].yVel <= 0) {
                temp_persons = movePerson(x, y, temp_persons, "down");
              } else {
                temp_persons = movePerson(x, y, temp_persons, "up");
              }
            } else if (axis == "lr") {
              if (persons[x][y].xVel <= 0) {
                temp_persons = movePerson(x, y, temp_persons, "left");
              } else {
                temp_persons = movePerson(x, y, temp_persons, "right");
              }
            }
          }
        } else {
          // if they are dead
          if (persons[x][y].deadtime > death_wait) {
            temp_persons[x][y] = null;
            totalDead++;
          } else {
            temp_persons[x][y].deadtime++;
          }
        }
      } else {
        // do nothing
      }
    }
  }
  persons = temp_persons;

  // apply to graphs
  graphStuff();

  // apply to p5
  drawPeople();
}

/**
 * Moves person at (x,y) in given direction.
 * Does not move unless movement is within square and moving to empty space
 * Returns new board
 * @param {*} x
 * @param {*} y
 * @param {*} temp_persons
 * @param {*} direction direction to move. one of: "up" "down" "left" "right"
 */
function movePerson(x, y, temp_persons, direction) {
  temp_persons[x][y].distance++;
  if (
    x + 1 < temp_persons.length &&
    temp_persons[x + 1][y] == null &&
    direction === "right"
  ) {
    temp_persons[x + 1][y] = temp_persons[x][y];
    temp_persons[x][y] = null;
  } else if (
    x - 1 > 0 &&
    temp_persons[x - 1][y] == null &&
    direction === "left"
  ) {
    temp_persons[x - 1][y] = temp_persons[x][y];
    temp_persons[x][y] = null;
  } else if (
    y + 1 < temp_persons.length &&
    temp_persons[x][y + 1] == null &&
    direction === "up"
  ) {
    temp_persons[x][y + 1] = temp_persons[x][y];
    temp_persons[x][y] = null;
  } else if (
    y - 1 > 0 &&
    temp_persons[x][y - 1] == null &&
    direction === "down"
  ) {
    temp_persons[x][y - 1] = temp_persons[x][y];
    temp_persons[x][y] = null;
  }
  return temp_persons;
}

/**
 * Applies the effects of the infection onto one person. The effects being death, or development of immunity.
 * @param {*} x
 * @param {*} y
 * @param {*} temp_persons
 */
function applyInfection(x, y, temp_persons) {
  // Should be called only on infected person
  try {
    random_number = Math.random(0, 1);
    // if not dead or immune
    if (!temp_persons[x][y].dead && !temp_persons[x][y].immune) {
      if (
        develop_immunity &&
        temp_persons[x][y].survivedTime >= immune_develop_num
      ) {
        // lived long enough with infection to develop immunity
        temp_persons[x][y].immune = true;
        temp_persons[x][y].survivedTime = 0;
      } else if (random_number < death_chance) {
        // dies
        temp_persons[x][y].dead = true;
      } else {
        // survives a little longer
        temp_persons[x][y].survivedTime++;
      }
    }
  } catch (error) {}
  return temp_persons;
}

/**
 * Returns an updated 2d array after infecting one person
 * @param {*} x
 * @param {*} y
 * @param {*} temp_persons
 */
function infectOthers(x, y, temp_persons) {
  try {
    if (
      Math.random() < infection_chance &&
      !temp_persons[x][y].infected &&
      !temp_persons[x][y].immune
    ) {
      temp_persons[x][y].infected = true;
      num_infected++;
    }
  } catch (error) {}
  return temp_persons;
}

/**
 * Tracks person's recovery after becoming immune to becoming healthy again. (A normal person who can be infected again)
 * Should be called after if person is infected/immune/dead check is done
 * @param {*} x
 * @param {*} y
 * @param {*} temp_persons
 */
function applyRecovery(x, y, temp_persons) {
  try {
    if (temp_persons[x][y].survivedTime >= time_to_recover) {
      // enough time passed to recover
      temp_persons[x][y].infected = false;
      temp_persons[x][y].immune = false;
      temp_persons[x][y].survivedTime = 0;
    } else {
      // more time until recovered
      temp_persons[x][y].survivedTime++;
    }
  } catch (error) {}
  return temp_persons;
}

/**
 * Draw the current population to the p5 graph
 */
function drawPeople() {
  clear();
  var individual_size = height / side_size / 1.5;
  for (var x = 0; x < persons.length; x++) {
    for (var y = 0; y < persons[0].length; y++) {
      if (persons[x][y] != null) {
        if (persons[x][y] == "wall") {
          fill(color("rgb(0,0,0)"));
        } else if (persons[x][y].dead) {
          fill(color(dead_color)); // dead color
        } else if (persons[x][y].immune) {
          fill(color(immune_color)); // immune color
        } else {
          if (persons[x][y].infected) {
            fill(color(infected_color)); // infected color
          } else {
            fill(color(healthy_color)); // healthy color
          }
        }
        circle(
          x * (height / side_size) + height / side_size / 2,
          y * (height / side_size) + height / side_size / 2,
          individual_size
        );
      } else {
        //draw nothing
      }
    }
  }
  redraw();
}

/**
 * Gets the number of each demographic for plotting on the graph
 *
 * Returns an object with labels infected, dead, immune, healthy with values
 * corrisponding to each demographic's population size
 */
function getTotals() {
  infected = 0;
  dead = 0;
  immune = 0;
  healthy = 0;

  if (persons.length == 0) {
    return 0;
  }

  for (var x = 0; x < persons.length; x++) {
    for (var y = 0; y < persons[0].length; y++) {
      if (persons[x][y] != null) {
        if (persons[x][y].dead) {
          dead++;
        } else if (persons[x][y].immune) {
          immune++;
        } else if (persons[x][y].infected) {
          infected++;
        } else {
          healthy++;
        }
      }
    }
  }
  return { infected: infected, dead: dead, immune: immune, healthy: healthy };
}

/**
 * Selects an outcome based on input probabilities
 * Returns null if probabilities don't add to 100 (< or >)
 * @param {*} percents
 * @param {*} labels
 */
function pickPercent(percents, labels) {
  const arrSum = (arr) => arr.reduce((a, b) => a + b, 0);

  if (arrSum(percents) == 100) {
    var random_number = Math.random();
    var threshhold = 0;
    for (i = 0; i <= percents.length; i++) {
      threshhold = threshhold + percents[i] / 100;
      if (random_number < threshhold) {
        return labels[i];
      }
    }
  } else {
    return null;
  }
}
