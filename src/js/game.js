$(document).ready(function () {
	var prefix = "batt";
	var extension = ".gif";

	/* Information used to draw the ships */
	var ship = [[[1, 5], [1, 2, 5], [1, 2, 3, 5], [1, 2, 3, 4, 5]], [[6, 10], [6, 7, 10], [6, 7, 8, 10], [6, 7, 8, 9, 10]]];

	/* Information used to draw sunk ships */
	var dead = [[[201, 203], [201, 202, 203], [201, 202, 202, 203], [201, 202, 202, 202, 203]], [[204, 206], [204, 205, 206], [204, 205, 205, 206], [204, 205, 205, 205, 206]]];

	/* Information used to describe ships */
	var shipTypes = [["Minesweeper", 2, 4], ["Frigate", 3, 4], ["Cruiser", 4, 2], ["Battleship", 5, 1]];

	var girdX = 16, girdY = 16;
	var allied = [], enemy = [], alliedShips = [], enemyShips = [];
	var alliedLives = 0, enemylives = 0, playflag = true, statusMessage = "";

	/* Function to preload all the images, to prevent delays during play */
	var preloaded = [];
	function Preload() {
		var i, ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100, 101, 102, 103, 201, 202, 203, 204, 205, 206];
		window.status = "Getting our bearings...";
		for (i = 0; i < ids.length; ++i) {
			var img = new Image, name = prefix + ids[i] + extension;
			img.src = name;
			preloaded[i] = img;
		}
		window.status = "";
	}

	/* Function to place the ships in the grid */
	function ArmShips(isEnemy) {
		var y, x;
		grid = [];
		for (y = 0; y < girdX; ++y) {
			grid[y] = [];
			for (x = 0; x < girdX; ++x)
				grid[y][x] = [100, -1, 0];
		}

		var shipNumber = 0;
		var s;
		for (s = shipTypes.length - 1; s >= 0; --s) {
			var i;
			for (i = 0; i < shipTypes[s][2]; ++i) {
				var d = Math.floor(Math.random() * 2);
				var len = shipTypes[s][1], lx = girdX, ly = girdY, dx = 0, dy = 0;
				if (d == 0) {
					lx = girdX - len;
					dx = 1;
				}
				else {
					ly = girdY - len;
					dy = 1;
				}
				var x, y, ok;
				do {
					y = Math.floor(Math.random() * ly);
					x = Math.floor(Math.random() * lx);
					var j, cx = x, cy = y;
					ok = true;
					for (j = 0; j < len; ++j) {
						if (grid[cy][cx][0] < 100) {
							ok = false;
							break;
						}
						cx += dx;
						cy += dy;
					}
				} while (!ok);
				var j, cx = x, cy = y;
				for (j = 0; j < len; ++j) {
					grid[cy][cx][0] = ship[d][s][j];
					grid[cy][cx][1] = shipNumber;
					grid[cy][cx][2] = dead[d][s][j];
					cx += dx;
					cy += dy;
				}
				if (isEnemy) {
					enemyShips[shipNumber] = [s, shipTypes[s][1]];
					enemylives++;
				}
				else {
					alliedShips[shipNumber] = [s, shipTypes[s][1]];
					alliedLives++;
				}
				shipNumber++;
			}
		}
		return grid;
	}

	/* Function to change an image shown on a grid */
	function SetImage(y, x, id, isEnemy) {
		if (isEnemy) {
			enemy[y][x][0] = id;
			document.images["pc" + y + "_" + x].src = "batt" + id + ".gif";
		}
		else {
			allied[y][x][0] = id;
			document.images["ply" + y + "_" + x].src = "batt" + id + ".gif";
		}
	}

	/* Function to insert HTML source for a grid */
	function ShowGrid(isEnemy) {
		var y, x;
		for (y = 0; y < girdY; ++y) {
			for (x = 0; x < girdX; ++x) {
				if (isEnemy)
					document.write('<a href="#" class="grid open" data-x="' + x + '" data-y="' + y + '"><img name="pc' + y + '_' + x + '" src="' + prefix + '100' + extension + '"></a>');
				else
					document.write('<a href="#" class="grid closed" data-x="' + x + '" data-y="' + y + '"><img name="ply' + y + '_' + x + '" src="' + prefix + allied[y][x][0] + extension + '"></a>');
			}
			document.write('<br>');
		}
	}

	/* Handler for clicking on the grid */
	function CommenceFiring(y, x) {
		if (playflag) {
			if (enemy[y][x][0] < 100) {
				SetImage(y, x, 103, true);
				var shipNumber = enemy[y][x][1];
				if (--enemyShips[shipNumber][1] == 0) {
					SinkShip(enemy, shipNumber, true);
					alert("You sank my " + shipTypes[enemyShips[shipNumber][0]][0] + "!");
					UpdateStatus();
					if (--enemylives == 0) {
						alert("You win! Press the Refresh button on\n" +
							"your browser to play another game.");
						playflag = false;
					}
				}
				if (playflag) TorpedoesInTheWater();
			}
			else if (enemy[y][x][0] == 100) {
				SetImage(y, x, 102, true);
				TorpedoesInTheWater();
			}
		}
	}

	/* Function to make the enemy's move. Note that the enemy does not cheat, oh no! */
	function TorpedoesInTheWater() {
		var x, y, pass;
		var sx, sy;
		var selected = false;

		/* Make two passes during 'shoot to kill' mode */
		for (pass = 0; pass < 2; ++pass) {
			for (y = 0; y < girdY && !selected; ++y) {
				for (x = 0; x < girdX && !selected; ++x) {
					/* Explosion shown at this position */
					if (allied[y][x][0] == 103) {
						sx = x; sy = y;
						var nup = (y > 0 && allied[y - 1][x][0] <= 100);
						var ndn = (y < girdY - 1 && allied[y + 1][x][0] <= 100);
						var nlt = (x > 0 && allied[y][x - 1][0] <= 100);
						var nrt = (x < girdX - 1 && allied[y][x + 1][0] <= 100);
						if (pass == 0) {
							/* On first pass look for two explosions in a row - next shot will be inline */
							var yup = (y > 0 && allied[y - 1][x][0] == 103);
							var ydn = (y < girdY - 1 && allied[y + 1][x][0] == 103);
							var ylt = (x > 0 && allied[y][x - 1][0] == 103);
							var yrt = (x < girdX - 1 && allied[y][x + 1][0] == 103);
							if (nlt && yrt) { sx = x - 1; selected = true; }
							else if (nrt && ylt) { sx = x + 1; selected = true; }
							else if (nup && ydn) { sy = y - 1; selected = true; }
							else if (ndn && yup) { sy = y + 1; selected = true; }
						}
						else {
							/* Second pass look for single explosion - fire shots all around it */
							if (nlt) { sx = x - 1; selected = true; }
							else if (nrt) { sx = x + 1; selected = true; }
							else if (nup) { sy = y - 1; selected = true; }
							else if (ndn) { sy = y + 1; selected = true; }
						}
					}
				}
			}
		}
		if (!selected) {
			/* 
			   Nothing found in 'shoot to kill' mode, so we're just taking potshots. 
			   Random shots are in a chequerboard pattern for maximum efficiency, and never twice in the same place
			*/
			do {
				sy = Math.floor(Math.random() * girdY);
				sx = Math.floor(Math.random() * girdX / 2) * 2 + sy % 2;
			} while (allied[sy][sx][0] > 100);
		}
		if (allied[sy][sx][0] < 100) {
			/* Hit something */
			SetImage(sy, sx, 103, false);
			var shipNumber = allied[sy][sx][1];
			if (--alliedShips[shipNumber][1] == 0) {
				SinkShip(allied, shipNumber, false);
				alert("I sank your " + shipTypes[alliedShips[shipNumber][0]][0] + "!");
				if (--alliedLives == 0) {
					KnowYourEnemy();
					alert("I win! Press the Refresh button on\n" + "your browser to play another game.");
					playflag = false;
				}
			}
		}
		else {
			/* Missed */
			SetImage(sy, sx, 102, false);
		}
	}

	/* When whole ship is hit, show it using changed graphics */
	function SinkShip(grid, shipNumber, isEnemy) {
		var y, x;
		for (y = 0; y < girdX; ++y) {
			for (x = 0; x < girdX; ++x) {
				if (grid[y][x][1] == shipNumber)
					if (isEnemy) SetImage(y, x, enemy[y][x][2], true);
					else SetImage(y, x, allied[y][x][2], false);
			}
		}
	}

	/* Show location of all the enemy's ships - when allied has lost */
	function KnowYourEnemy() {
		var y, x;
		for (y = 0; y < girdX; ++y) {
			for (x = 0; x < girdX; ++x) {
				if (enemy[y][x][0] == 103)
					SetImage(y, x, enemy[y][x][2], true);
				else if (enemy[y][x][0] < 100)
					SetImage(y, x, enemy[y][x][0], true);
			}
		}
	}

	/* Show how many ships enemy has left */
	function UpdateStatus() {
		var f = false, i, s = "enemy has ";
		for (i = 0; i < enemyShips.length; ++i) {
			if (enemyShips[i][1] > 0) {
				if (f) s = s + ", "; else f = true;
				s = s + shipTypes[enemyShips[i][0]][0];
			}
		}
		if (!f) s = s + "nothing left, thanks to you!";
		statusMessage = s;
		window.status = statusMessage;
	}
	function setStatus() {
		window.status = statusMessage;
	}

	/* Start the game! */
	Preload();
	allied = ArmShips(false);
	enemy = ArmShips(true);
	document.write("<center><table><tr><td align=center><p class='heading'>Enemy Fleet</p></td>" +
		"<td align=center><p class='heading'>Allied Fleet</p></td></tr><tr><td>");
	ShowGrid(true);
	document.write("</td><td>");
	ShowGrid(false);
	document.write("</td></tr></table></center>");
	UpdateStatus();
	setInterval("setStatus();", 500);


	$(".grid").click(function(e) {
		if ($(this).hasClass('open')) {
			CommenceFiring($(this).data('y'), $(this).data('x'));
		}
		e.preventDefault();
	});
});