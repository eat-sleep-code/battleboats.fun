module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: ['tmp/'],
		concat: {
			options: {
				separator: '\n',
				stripBanners: {
					block: true
				}
			},
			scripts: {
				src: [
					'src/js/game.js'
				],
				dest: 'tmp/battleboats.concat.js',
			},
			style: {
				src: [
					'src/css/game.css'
				],
				dest: 'tmp/app.css'
			}
		},
		jsObfuscate: {
			scripts: {
				options: {
					concurrency: 2,
					keepLinefeeds: false,
					keepIndentations: false,
					encodeStrings: true,
					encodeNumbers: true,
					moveStrings: true,
					replaceNames: true,
					variableExclusions: ['^_get_', '^_set_', '^_mtd_']
				},
				files: {
					'tmp/battleboats.obfuscate.js': [
						'tmp/battleboats.concat.js'
					]
				}
			}
		},
		babel: {
			options: {
				sourceMap: false
			},
			invaders: {
				files: {
					"dist/js/app.min.js": "tmp/battleboats.obfuscate.js"
				}
			}
		},
		cssmin: {
			target: {
				files: [{
					expand: true,
					cwd: 'tmp',
					src: ['app.css'],
					dest: 'dist/css',
					ext: '.min.css'
				}]
			}
		},
		git_deploy: {
			your_target: {
				options: {
					url: 'https://github.com/eat-sleep-code/battleboats.fun.git',
					branch: 'master'
				},
				src: '.'
			},
		}
	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('js-obfuscator');
	grunt.loadNpmTasks('grunt-babel')
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-git-deploy');

	grunt.registerTask('default', ['clean', 'concat', 'jsObfuscate', 'babel', 'cssmin', 'git_deploy']); //'git_deploy'
};