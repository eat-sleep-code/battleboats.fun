$(document).ready(function () {
	var prefix = "images/battle";
	var extension = ".svg";

	/* Information used to draw the ships */
	var ship = [[[1, 5], [1, 2, 5], [1, 2, 3, 5], [1, 2, 3, 4, 5]], [[6, 10], [6, 7, 10], [6, 7, 8, 10], [6, 7, 8, 9, 10]]];

	/* Information used to draw sunk ships */
	var dead = [[[201, 203], [201, 202, 203], [201, 202, 202, 203], [201, 202, 202, 202, 203]], [[204, 206], [204, 205, 206], [204, 205, 205, 206], [204, 205, 205, 205, 206]]];

	/* Information used to describe ships */
	var shipTypes = [["patrol boat", 2, 4], ["frigate", 3, 4], ["cruiser", 4, 2], ["battleship", 5, 1]];

	var gridX = 16;
	var gridY = 16;
	var allied = [];
	var enemy = [];
	var alliedShips = [];
	var enemyShips = [];
	var alliedLives = 0;
	var enemylives = 0;
	var playFlag = true;
	var round = 0;
	var statusMessage = "";

	/* Function to preload all the images, to prevent delays during play */
	var preloadedImages = [];
	function PreloadImages() {
		var i; 
		var ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100, 101, 102, 103, 201, 202, 203, 204, 205, 206];
		window.status = "Getting our bearings...";
		for (i = 0; i < ids.length; ++i) {
			var img = new Image;
			var name = prefix + ids[i] + extension;
			img.src = name;
			preloadedImages[i] = img;
		}
		window.status = "";
	}

	/* Function to place the ships in the grid */
	function ArmShips(isEnemy) {
		var y
		var x;
		var grid = [];
		for (y = 0; y < gridX; ++y) {
			grid[y] = [];
			for (x = 0; x < gridX; ++x)
				grid[y][x] = [100, -1, 0];
		}

		var shipNumber = 0;
		var s;
		for (s = shipTypes.length - 1; s >= 0; --s) {
			var i;
			for (i = 0; i < shipTypes[s][2]; ++i) {
				var d = Math.floor(Math.random() * 2);
				var len = shipTypes[s][1], lx = gridX, ly = gridY, dx = 0, dy = 0;
				if (d == 0) {
					lx = gridX - len;
					dx = 1;
				}
				else {
					ly = gridY - len;
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
			document.images["enemy" + y + "_" + x].src = prefix + id + extension;
		}
		else {
			allied[y][x][0] = id;
			document.images["allied" + y + "_" + x].src = prefix + id + extension;
		}
	}

	/* Function to insert HTML source for a grid */
	function RenderGrid(isEnemy) {
		var y;
		var x;
		var innerHtml = '';
		for (y = 0; y < gridY; ++y) {
			for (x = 0; x < gridX; ++x) {
				if (isEnemy) {
					innerHtml += '<img name="enemy' + y + '_' + x + '" src="' + prefix + '100' + extension + '" class="grid enemy" data-y="' + y + '" data-x="' + x + '">';
				}
				else {
					innerHtml += '<img name="allied' + y + '_' + x + '" src="' + prefix + allied[y][x][0] + extension + '" class="grid allied" data-y="' + y + '" data-x="' + x + '">';
				}
			}
		}
		return innerHtml;
	}

	/* Handler for clicking on the grid */
	function CommenceFiring(y, x) {
		if (playFlag) {
			if (enemy[y][x][0] < 100) {
				try {
					audio.hit.play();
				}
				catch(error) {}
				SetImage(y, x, 103, true);
				var shipNumber = enemy[y][x][1];
				if (--enemyShips[shipNumber][1] == 0) {
					SinkShip(enemy, shipNumber, true);
					UpdateAlert("You sank an enemy " + shipTypes[enemyShips[shipNumber][0]][0] + "!", 3000);
					UpdateStatus();
					if (--enemylives == 0) {
						UpdateAlert("You are victorious!", 10000, true);
						try {
							gtag('event', 'Win', {'event_category' : 'Game', 'event_label' : 'Player'});
						}
						catch(error) {}	
						playFlag = false;
					}
				}
				if (playFlag) TorpedoesInTheWater();
			}
			else if (enemy[y][x][0] == 100) {
				try
				{
					audio.splash.play();
				}
				catch(error) {}	
				SetImage(y, x, 102, true);
				TorpedoesInTheWater();
			}
		}
	}

	/* Function to make the enemy's move. Note that the enemy does not cheat, oh no! */
	function TorpedoesInTheWater() {
		$('.enemy-ships').removeClass('active-grid');
		$('.allied-ships').addClass('active-grid');
		//console.log("Enemy round underway...");
		
		window.setTimeout(function(){
			var x, y, pass;
			var sx, sy;
			var selected = false;

			/* Make two passes during 'shoot to kill' mode */
			for (pass = 0; pass < 2; ++pass) {
				for (y = 0; y < gridY && !selected; ++y) {
					for (x = 0; x < gridX && !selected; ++x) {
						/* Explosion shown at this position */
						if (allied[y][x][0] == 103) {
							sx = x; sy = y;
							var shotUp = (y > 0 && allied[y - 1][x][0] <= 100);
							var shotDown = (y < gridY - 1 && allied[y + 1][x][0] <= 100);
							var shotLeft = (x > 0 && allied[y][x - 1][0] <= 100);
							var shotRight = (x < gridX - 1 && allied[y][x + 1][0] <= 100);
							if (pass == 0) {
								/* On first pass look for two explosions in a row - next shot will be inline */
								var doubleShotUp = (y > 0 && allied[y - 1][x][0] == 103);
								var doubleShotDown = (y < gridY - 1 && allied[y + 1][x][0] == 103);
								var doubleShotLeft = (x > 0 && allied[y][x - 1][0] == 103);
								var doubleShotRight = (x < gridX - 1 && allied[y][x + 1][0] == 103);
								if (shotLeft && doubleShotRight) { sx = x - 1; selected = true; }
								else if (shotRight && doubleShotLeft) { sx = x + 1; selected = true; }
								else if (shotUp && doubleShotDown) { sy = y - 1; selected = true; }
								else if (shotDown && doubleShotUp) { sy = y + 1; selected = true; }
							}
							else {
								/* Second pass look for single explosion - fire shots all around it */
								if (shotLeft) { sx = x - 1; selected = true; }
								else if (shotRight) { sx = x + 1; selected = true; }
								else if (shotUp) { sy = y - 1; selected = true; }
								else if (shotDown) { sy = y + 1; selected = true; }
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
					sy = Math.floor(Math.random() * gridY);
					sx = Math.floor(Math.random() * gridX / 2) * 2 + sy % 2;
				} while (allied[sy][sx][0] > 100);
			}
			if (allied[sy][sx][0] < 100) {
				/* Hit something */
				try {
					audio.hit.play();
				}
				catch(error) {}
				SetImage(sy, sx, 103, false);
				var shipNumber = allied[sy][sx][1];
				if (--alliedShips[shipNumber][1] == 0) {
					SinkShip(allied, shipNumber, false);
					UpdateAlert("The enemy has sank your " + shipTypes[alliedShips[shipNumber][0]][0] + "!", 3000);
					if (--alliedLives == 0) {
						KnowYourEnemy();
						UpdateAlert("You have been defeated!", 10000, true);
						try {
							gtag('event', 'Win', {'event_category' : 'Game', 'event_label' : 'Computer'});
						}
						catch(error) {}	
						playFlag = false;
					}
				}
			}
			else {
				/* Missed */
				try {
					audio.splash.play();
				}
				catch(error) {}
				SetImage(sy, sx, 102, false);
			}
			//console.log("Enemy round complete...");
			$('.enemy-ships').addClass('active-grid');
			$('.allied-ships').removeClass('active-grid');
		}, 3000);
	}

	/* When whole ship is hit, show it using changed graphics */
	function SinkShip(grid, shipNumber, isEnemy) {
		try {
			audio.sink.play();
		}
		catch(error) {}
		var y, x;
		for (y = 0; y < gridX; ++y) {
			for (x = 0; x < gridX; ++x) {
				if (grid[y][x][1] == shipNumber)
					if (isEnemy) SetImage(y, x, enemy[y][x][2], true);
					else SetImage(y, x, allied[y][x][2], false);
			}
		}
	}

	/* Show location of all the enemy's ships - when allied has lost */
	function KnowYourEnemy() {
		var y, x;
		for (y = 0; y < gridX; ++y) {
			for (x = 0; x < gridX; ++x) {
				if (enemy[y][x][0] == 103)
					SetImage(y, x, enemy[y][x][2], true);
				else if (enemy[y][x][0] < 100)
					SetImage(y, x, enemy[y][x][0], true);
			}
		}
	}

	/* Show how many ships enemy has left */
	function UpdateStatus() {
		var f = false, i, s = "The enemy has ";
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

	function UpdateAlert(message, showFor = 3000, reloadAfter = false) {
		//console.log(message, showFor);
		$('.logo').hide();
		$('.alert').empty().show().html(message).delay(showFor).fadeOut(300);
		if (reloadAfter == true) {
			$('.enemy-ships').removeClass('active-grid');
			$('.allied-ships').removeClass('active-grid');
			window.setTimeout(function(){
				$('.logo').show();
				StartGame();
			}, showFor/2);
		}
	}
	

	/* Start the game! */
	function StartGame() {
		PreloadImages();
		allied = ArmShips(false);
		enemy = ArmShips(true);
		$('.enemy-ships').html(RenderGrid(true));
		$('.allied-ships').html(RenderGrid(false));
		
		$('.enemy-ships').addClass('active-grid');
		$('.allied-ships').removeClass('active-grid');
		
		$('.game-container').show();

		round = round + 1;
		try {
			gtag('event', 'Start', {'event_category' : 'Game', 'event_label' : round});
		}
		catch(error) {}			
		UpdateStatus();
	}

	StartGame();

	$(".enemy").click(function(e) {
		if ($('.enemy-ships').hasClass('active-grid') && playFlag == true) {
			//console.log("Firing...");
			CommenceFiring($(this).data('y'), $(this).data('x'));
		}
	});
});
