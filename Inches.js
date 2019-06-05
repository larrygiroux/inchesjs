/*

$$$$$$\                     $$\                                                   
\_$$  _|                    $$ |                                                  
  $$ |  $$$$$$$\   $$$$$$$\ $$$$$$$\   $$$$$$\   $$$$$$$\           $$\  $$$$$$$\ 
  $$ |  $$  __$$\ $$  _____|$$  __$$\ $$  __$$\ $$  _____|          \__|$$  _____|
  $$ |  $$ |  $$ |$$ /      $$ |  $$ |$$$$$$$$ |\$$$$$$\            $$\ \$$$$$$\  
  $$ |  $$ |  $$ |$$ |      $$ |  $$ |$$   ____| \____$$\           $$ | \____$$\ 
$$$$$$\ $$ |  $$ |\$$$$$$$\ $$ |  $$ |\$$$$$$$\ $$$$$$$  |$$\       $$ |$$$$$$$  |
\______|\__|  \__| \_______|\__|  \__| \_______|\_______/ \__|      $$ |\_______/ 
                                                              $$\   $$ |          
                                                              \$$$$$$  |          
                                                               \______/     

Create a new Inches instance by passing the input to the constructor.
The length of an instance of inches is always saved in the parts property which is a plain object with the following properties:
this.parts = {
	f:		// The number of feet (integer). 
	i:		// The number of inches (integer). If this is greater than this.max_inches, the inches will be carried into this.parts.f
	num:	// The numerator of the fraction that is understood to have the denominator 2048. This allows for fast formatted string gen as will as fast decimal number gen.
}

The above plain object is returned by the ._process() method which takes integers, floats, other instances of Inches, just the parts property of an Inches instance 
or any of the the following chaotic string formats as input (untility method):
1ft
-1ft (will be saved as negative)
-0 1/2 (will be saved as negative)
-1' 0 1/2" (will be saved as negative)
1 foot
3 inches
1/16"
1/15" [.str() method will round fractions to the nearest this.inc'th]
0.125 (float)
'0.125' (string but will be treated as float)
1'-6 1/4"
1'-6-1/4"
1' 6-1/4"
1ft-6 1/4in
1ft 6 1/4in
1foot 6 1/4 inches
1 foot 1/4 inches
2 feet 6 1/4 inches
2 6 1 4 (space separated "feet inch numerator denominator")
6 1 4 (space separated "inch numerator denominator")
etc.

the .add() and .less() and .update() methods will take the same types of inputs as the constructor as they all use the process and then carry methods.
*/

class Inches{
	constructor(input = '', inc = 0, max_inches = 11, mm_mode = false){
		this.set_inc(inc);
		this.set_max_inches(max_inches);
		this.mm_mode	= mm_mode? true: false; // change to true to force numeric inputs (integers and floats) to mm inputs instead of using the mm, cm or m suffix for the input.
		this.err_msg	= false; // Write string here if ._process() method runs into an issue with input.
		this.update(input); //Process the chaotic input into a standard plain object that is understood by the other methods. The second and third constructor arguments WILL NOT be overwritten if Inches instance is passed.
	}
	set_inc(inc = 0){
		this.inc 		= (inc && this._increments().indexOf(Number(inc)) > -1)? 	Number(inc): 	16; // Accuracy of the .str() method. Default: 1/16 of an inch is the smallest increment returned in resulting string. Pass 1 here to round fractions to full inches.
	}
	set_max_inches(max_inches = 11){
		this.max_inches	= (max_inches && Number(max_inches))?						max_inches*1:	11;	// This property tells the .str() method to only convert inches to feet if the resulting inches exceeds this max value. If .max_inches = 24, .str() will return '18 1/4"' for 18.25 decimal inches.
	}
	update(input = {}){ // update the current instance with new input. Pass an Inches instance or chaotic input.
		this.parts		= this._process(input);
		this._carry();
		return this;
	}
	add(input = {}){ // add input to current Inches instance. Pass an Inches instance or chaotic input.
		input = this._process(input);
		if(input.hasOwnProperty('mm') && input.mm){ // Input was metric and was not zero. This is because the mm property only exists if input is metric or after the _carry() method call. Use mm accuracy.
			this.parts.mm 	= this.parts.mm*1 + input.mm*1; 
			this.parts.i 	= this.dec(0,10)*1 + (input.mm/25.4);
		}else{ // input not metric. let the _carry method determine the mm value
			this.parts.i	= this.dec(0,10)*1 + this.dec(0,10,input)*1;
			this.parts.mm	= 0; // _carry() will handle this
		}
		this.parts.f 	= 0;
		this.parts.num 	= 0;
		this._carry();
		return this;
	}
	less(input = {}){ // Subtract input from current Inches instance. Pass an Inches instance or chaotic input.
		input = this._process(input);
		if(input.hasOwnProperty('mm') && input.mm){ // Input was metric and was not zero. This is because the mm property only exists if input is metric or after the _carry() method call. Use mm accuracy.
			this.parts.mm 	= this.parts.mm*1 - input.mm*1; 
			this.parts.i 	= this.dec(0,10)*1 - (input.mm/25.4);
		}else{ // input not metric. let the _carry method determine the mm value
			this.parts.i	= this.dec(0,10)*1 - this.dec(0,10,input)*1;
			this.parts.mm	= 0; // _carry() will handle this
		}
		this.parts.f 	= 0;
		this.parts.num 	= 0;
		this._carry();
		return this;
	}
	dec(str = 0, accuracy = 2, o = {}){ // decimal inches. 3rd argument is for use as a utility method by the add and less methods.
		var o 	= (typeof o === 'object' && o.hasOwnProperty('f') && o.hasOwnProperty('i') && o.hasOwnProperty('num'))? o: this.parts;
		var rv 	= o.f*12 + o.i*1 + (o.num*1 / 2048);
			rv 	= this._accurate_dec(rv,accuracy);
		switch(str){
			case 1: str = 'in';		break;
			case 2: str = ' in';	break;
			case 3: str = 'IN';		break;
			case 4: str = ' IN';	break;
			case 5: str = '"';		break;
			case 6: rv === 1? str = 'inch': 	str = 'inches';		break;
			case 7: rv === 1? str = ' inch': 	str = ' inches';	break;
			case 8: rv === 1? str = 'INCH': 	str = 'INCHES';		break;
			case 9: rv === 1? str = ' INCH': 	str = ' INCHES';	break;
			default:;
		}
		return str? rv + str: rv*1;
	}
	eng(str = 0, accuracy = 4){ // decimal feet (a.k.a. engineering units)
		var rv = this.parts.f*1 + (this.parts.i*1 + (this.parts.num*1 / 2048))/12;
			rv = this._accurate_dec(rv,accuracy);
		switch(str){
			case 1: str = 'ft';		break;
			case 2: str = ' ft';	break;
			case 3: str = 'FT';		break;
			case 4: str = ' FT';	break;
			case 5: str = '\'';		break;
			case 6: rv === 1? str = 'foot': 	str = 'feet';		break;
			case 7: rv === 1? str = ' foot': 	str = ' feet';		break;
			case 8: rv === 1? str = 'FOOT': 	str = 'FEET';		break;
			case 9: rv === 1? str = ' FOOT': 	str = ' FEET';		break;
			default:;
		}
		return str? rv + str: rv;
	}
	str(long_form = false){ // roughly standard imperial construction str format.
		var increments		= this._increments();
		this.inc			= increments.indexOf(this.inc)? this.inc: 16;
		var return_value 	= '',
			numerator		= Math.abs(this.parts.num),
			denominator		= 2048,
			use_inches		= Math.abs(this.parts.i),
			use_fraction	= '',
			minus_sign		= this.dec(0,10,this.parts) < 0? '-': 	'';
		var long_form_ft	= long_form? 		"ft": 	"'";
		var long_form_in	= long_form? 		"in": 	'"';
		if(this.parts.f) return_value = Math.abs(this.parts.f) + long_form_ft + "-"; // foot value is not zero, so add to the string.
		if(numerator && denominator){
			if(denominator > this.inc){ // denominator is still larger than specified by constructor arguments.
				numerator 	= Math.round((this.inc*numerator)/denominator).toFixed();
				denominator	= this.inc*1;
			}
			while(!(numerator % 2) && !(denominator % 2) && !(denominator/2 % 2)){ // Convert the x/this.inc fraction into a proper dyadic fraction.
				numerator 	= numerator/2;
				denominator = denominator/2;
			}
			if(numerator*1 === denominator*1){
				use_inches++;
				numerator = 0;
				denominator = 0;
			}
			if(numerator*1) use_fraction = ' ' + numerator + '/' + denominator; // Only add the fraction if this.parts.num (numerator) is greater than zero.	
		}
		return_value = return_value + use_inches + use_fraction + long_form_in; // always add inches even if 0
		return minus_sign + return_value;
	}
	// metric
	mm(str = 0, accuracy = 1){
		var rv = this.parts.mm*1;
			rv = this._accurate_dec(rv, accuracy);
		switch(str){
			case 1: str = 'mm';		break;
			case 2: str = ' mm';	break;
			case 3: str = 'MM';		break;
			case 4: str = ' MM';	break;
			default:;
		}
		return str? rv + str: 	rv;
	}
	cm(str = 0, accuracy = 2){
		var rv = this.parts.mm/10;
			rv = this._accurate_dec(rv, accuracy);
		switch(str){
			case 1: str = 'cm';		break;
			case 2: str = ' cm';	break;
			case 3: str = 'CM';		break;
			case 4: str = ' CM';	break;
			default:;
		}
		return str? rv + str: 	rv;
	}
	m(str = 0, accuracy = 4){
		var rv = this.parts.mm/1000;
			rv = this._accurate_dec(rv, accuracy);
		switch(str){
			case 1: str = 'm';		break;
			case 2: str = ' m';		break;
			case 3: str = 'M';		break;
			case 4: str = ' M';		break;
			default:;
		}
		return str? rv + str: 	rv;
	}
	// Utilities
	_process(input = ''){ // Needs to be separate from the constructor so it can be used in other methods like .add() and .less().
		this.input 	= input; // Save here for reference/troubleshooting/error-reporting.
		var o 		= false;
		if( // Inches instance passed as input
			typeof input === 'object' && 
			input.hasOwnProperty('parts') && 
			typeof input.parts === 'object' && 
			input.parts.hasOwnProperty('f') && 
			input.parts.hasOwnProperty('i') && 
			input.parts.hasOwnProperty('num')
		){
			o = JSON.parse(JSON.stringify(input.parts));
		}
		if( // .parts property of an Inches instance passed as input
			typeof input === 'object' && 
			input.hasOwnProperty('f') && 
			input.hasOwnProperty('i') && 
			input.hasOwnProperty('num')
		){
			o = JSON.parse(JSON.stringify(input));
		}
		if(!o && Number(input) == input){ // int or float possibly as string.
			if(this.mm_mode){ // decimal mm
				o = this._mm_obj(input);
			}else{ // decimal inches
				o = {i: Number(input)};
			}
		}
		if(!o && typeof input === 'string' && input.length){
			input			= input.toLowerCase();
			o				= {i: 0};
			var numerator	= 0,
				denominator	= 0,
				feet		= 0,
				factor		= input.indexOf('-') === 0? -1: 1; // input is negative
			if(input[input.length - 1] === 'm'){// metric test. if last letter is m, investigate further
				var metric_factor	= 1000,	// meter to inch conversion rate
					subdivision		= '', 		// cent or milli
					metric_test 	= input.toLowerCase().split('');
					metric_test.pop(); // discard that last m
				if(metric_test[metric_test.length - 1] === 'c' || metric_test[metric_test.length - 1] === 'm'){
					subdivision		= metric_test.pop();
					switch(subdivision){
						case 'c': metric_factor = 10; break;
						case 'm': metric_factor = 1; break;
						default:;
					}
				}
				metric_test.filter(function(el){return el !== ' '});
				metric_test = Number(metric_test.join(''));
				if(!isNaN(metric_test)){
					return this._mm_obj(metric_test*factor*metric_factor);
				}
			}
			// simplify the string to get digits
			input = input.replace(/[~`!@#$%^&*()\-\+={}[]|[\]\\:;\"<>, ]/g,"_").replace(/(f|')/i,"**!**").replace(/\//i,"**/**").replace(/[a-zA-Z]+/g,"");
			// After the replace methods are run, all inputs with a foot value will have **!** and all those with fractions WILL have a **/**.
			// First break out the foot value if any
			if(input.indexOf('**!**') > 0){
				feet 		= input.split('**!**');
				feet 		= feet.length? 								Number(feet[0].replace(/_/g,'')): 			0;
			}
			input			= (!feet || isNaN(feet))? 					input:										input.split('**!**')[1];
			o.i				= (!feet || isNaN(feet))? 					o.i:										o.i*1 + feet*12;
			// Then break out denominator if any
			denominator		= input.split('').reverse().join('');
			if(denominator.indexOf('**/**') > 0){
				denominator = Number(denominator.split('**/**')[0].split('').reverse().join('').replace(/_/g,'')); // need to fix backwards 2 or greater digit denominators (i.e. 16th)				
			}else{
				denominator	= 0;
			}
			input			= (!denominator || isNaN(denominator))? 	input:										input.split('**/**')[0];
			// Change input to array for final processing.
			input 			= input.split('_').filter(function(el){return (el.length && !isNaN(Number(el)))});
			if(!denominator && input.length > 2){ // sloppy fraction -> "inch numerator denominator"
				denominator = input.pop()*1;
			}
			if(denominator && !numerator && input.length){ // sloppy fraction -> "inch numerator denominator" or proper fraction -> "inch numerator/denominator"
				numerator	= input.pop()*1;
			}
			if(!feet && input.length > 1){ // sloppy (no ft character) feet
				feet 		= input.shift()*1;
				o.i 		= o.i*1 + feet*12;
			}
			o.i	= Number(input[0]) == input[0]? o.i*1 + input[0]*1: o.i; // Ignore any greater indexes of input as this indicates junk input.
			if(numerator && denominator && !isNaN(denominator)) o.i = o.i*1 + (numerator/denominator)*1;
			o.i = o.i*factor;
		}
		if(o){ // If o, then an acceptable object, number or string must have been passed.
			o.f		= 0;
			o.i		= o.hasOwnProperty('i')? 	o.i: 	0;
			o.num	= o.hasOwnProperty('num')? 	o.num: 	0;
			return o;
		}
		this.err_msg = 'Inches._process() method failed to return object.';
		console.trace(this.err_msg + ' input: "' + this.input.toString() + '", passed as:', typeof this.input);
		return {f: 0, i: 0, num: 0, mm: 0};
	}
	_to_pos_zero(zero){ // Fix negative zeros.
		if(!zero){ // Only test if 0 or -0
			return Math.max(zero,0);
		}
		return zero; // input may be integer or decimal.
	}
	_accurate_dec(val = 0, accuracy = 0){ // Returns a rounded decimal to a fized length minus trailing zeros.
		if(!val || Number(val) != val || Number(accuracy) != accuracy) return 0;
		var scaling_factor 	= Math.pow(10,(accuracy*1));
		var rv 				= (val*scaling_factor).toFixed(4);
			rv				= Math.round(rv)/scaling_factor;
		return this._to_pos_zero(rv)*1;
	}
	_mm_obj(arg){
		if(Number(arg) != arg){
			return {
				f:		0,
				i:		0,
				num:	0,
				mm:		0
			};
		}
		return {
			f:		0,
			i:		arg/25.4,
			num:	0,
			mm:		arg,
			
			mm_test: 0
		};
	}
	_increments(){
		return [1,2,4,6,8,16,32,64];
	}
	_carry(){ // Make sure that this.parts' values have been carried and that it is treated as a negative if necassary.
		this.parts.f	= this.parts.hasOwnProperty('f')? 	this._to_pos_zero(this.parts.f): 	0;
		this.parts.num	= this.parts.hasOwnProperty('num')? this._to_pos_zero(this.parts.num): 	0;
		this.parts.i 	= this.parts.hasOwnProperty('i')? 	this.parts.i*1 + this.parts.f*12 + (this.parts.num/2048): 0;
		this.parts.i 	= this._to_pos_zero(this.parts.i);
		if(!this.parts.i){ // mm based objects should only be created using the _mm_obj utility method to prevent non-zero mm value objects from dying here.
			this.parts.mm = 0;
			return;
		}
		var factor		= this.parts.i < 0? -1: 1;
		this.parts.i	= Math.abs(this.parts.i); // Made positive temporarily
		this.parts.f 	= 0; // added to o.i temporarily
		this.parts.num 	= 0; // added to o.i temporarily
		if(this.parts.i > this.max_inches){
			this.parts.f	= Math.floor(this.parts.i / 12);
			this.parts.i	= this.parts.i*1 - this.parts.f*12;
		}
		this.parts.num	= this.parts.i % 1? ((this.parts.i % 1)*2048).toFixed(): 	0;	// Decimal portion converted to whole 2048ths
		this.parts.i 	= this.parts.i % 1? Math.floor(this.parts.i): 				this.parts.i;
		this.parts.f	= this._to_pos_zero(this.parts.f*factor);
		this.parts.i	= this._to_pos_zero(this.parts.i*factor);
		this.parts.num	= this._to_pos_zero(this.parts.num*factor);
		this.parts.mm	= (!this.parts.hasOwnProperty('mm') || !this.parts.mm)? 	this.dec(0,10)*25.4: this._to_pos_zero(this.parts.mm);
	}
}