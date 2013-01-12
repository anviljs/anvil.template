## anvil.template

Data-driven (flat file) template rendering for anvil builds. This extension is intended primarily for use in generating static sites; not for use in application development where templates are rendered client or server-side.

## Built-in template engines

### Handlebars
Handlebars will render any file ending with .hbrs or .handlebars.

### Underscore
Underscore will render any file ending with .undr or .underscore.

## Conventions

### Template files
Template files are determined by their extension alone. Without configuration to specify multiple outputs, all template files detected will be output as .html files using the same set of data.

For example, a jade template "test.jade" would use this data to produce test.html as the only output file.

### Data
By default, this extension will load all .yaml and .json files found under the ./data directory (relative to the project's root) into a global state collection that all templates will use by default during rendering.

## Configuration

### Disable Rendering
If this extension is installed but you're working on an application and you need to preserve your templates in their original format; you will have to disable rendering via configuration:

```javascript
{
	"anvil.template": {
		"disable": true
	}
}
```

### Template Files
Templates can be configured to produce multiple output files using the files hash in the configuration block:

```javascript
{
	"anvil.template": {
		"files": {
			"input-template.hbrs": {
				"output-1.html": { ... },
				"output-2.html": { ... }
			}
		}
	}
}
```

Each output file gets its own configuration block. This block can be used to:
  * override or provide specific data values for that template
  * specify which data files to use to override the global context (which also removes those data files from the global context) 
  * provide rendering engine specific options (if the engine supports these).

```javascript
{
	"anvil.template": {
		"files": {
			"/input-template.hbrs": {
				"/output-1.html": {
					"template-specific-key": "template-specific-value",
					"data": [ "/file-1.json", "file-2.json" ],
					"options": { ... } // specific to each engine
				}
			}
		}
	}
}
```
### Data
As previously explained, all data files are loaded into one global context by default. If a file is ever listed in any output block's data array, then that file will no longer be loaded into the global context, but instead will be used by any output file that lists it in order to override or provide specific values.