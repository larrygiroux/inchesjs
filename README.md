# inchesjs
Javascript class for handling chaotic imperial dimensions as typed by end users.
Create a new Inches instance by passing the input to the constructor.
The length of an instance of inches is always saved in the parts property which is a plain object with the following properties:
this.parts = {
	f:		// The number of feet (integer). 
	i:		// The number of inches (integer). If this is greater than this.max_inches, the inches will be carried into this.parts.f
	num:	// The numerator of the fraction that is understood to have the denominator 2048. This allows for a quickly formatted imperial string or a quickly calculated decimal value.
}

The above plain object is returned by the ._process() method which takes integers, floats, other instances of Inches, just the parts property of an Inches instance or any of the the following chaotic string formats as input:

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

the .add() and .less() and .update() methods will take the same types of inputs as the constructor.

Demo and docs at inchesjs.com
