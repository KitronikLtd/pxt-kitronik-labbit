/**
 * Blocks for driving the Kitronik LAB bit Board
 */
//% weight=100 color=#00A654 icon="\uf0c6" block="LAB bit"
//% groups='["Inputs", "Motor", "ZIP LEDs"]'
namespace kitronik_labbit {
	/**
	 * Well known colors for ZIP LEDs
	 */
	enum ZipLedColors {
	    //% block=red
	    Red = 0xFF0000,
	    //% block=orange
	    Orange = 0xFFA500,
	    //% block=yellow
	    Yellow = 0xFFFF00,
	    //% block=green
	    Green = 0x00FF00,
	    //% block=blue
	    Blue = 0x0000FF,
	    //% block=indigo
	    Indigo = 0x4b0082,
	    //% block=violet
	    Violet = 0x8a2be2,
	    //% block=purple
	    Purple = 0xFF00FF,
	    //% block=white
	    White = 0xFFFFFF,
	    //% block=black
	    Black = 0x000000
	}

    /*Note that Forward and reverse are slightly arbitrary, as it depends on how the motor is wired...*/
    /**
     * Different directions for motors to turn
     */
    export enum MotorDirection {
        //% block="forward"
        Forward,
        //% block="reverse"
        Reverse
    }

    /**
     * Motor outputs available on board
     */
    export enum Motors {
        //% block="motor 1"
        Motor1,
        //% block="motor 2"
        Motor2
    }

    /**
     * Different modes for RGB or RGB+W ZIP strips
     */
    export enum ZipLedMode {
        //% block="RGB (GRB format)"
        RGB = 0,
        //% block="RGB+W"
        RGBW = 1,
        //% block="RGB (RGB format)"
        RGB_RGB = 2
    }

    /**
     * Different ZIP LED brightness settings
     */
    export enum ZipLedBrightness {
        //% block="Dim"
        Dim = 25,
        //% block="Normal"
        Normal = 128,
        //% block="Bright"
        Bright = 200,
        //% block="Super Bright"
        SuperBright = 255
    }

    /**
     * ZIP LED Hue Interpolation direction options
     */
    export enum HueInterpolationDirection {
        //% block="Clockwise"
        Clockwise,
        //% block="CounterClockwise"
        CounterClockwise,
        //% block="Shortest"
        Shortest
    }
    
    export enum LightStatus {
        //% block="stop"
        Stop,
        //% block="get ready"
        GetReady,
        //% block="go"
        Go,
        //% block="ready to stop"
        ReadyToStop
    }
    
    export enum LightShow {
        //% block="on"
        On,
        //% block="off"
        Off
    }
    
    export enum TrafficLight {
        //% block="I"
        one,
        //% block="II"
        two
    }

    export enum LightColour {
        //% block="red"
        red,
        //% block="yellow"
        yellow,
        //% block="green"
        green
    }

    // Units for ultrasonic sensors to measure
    export enum Units {
        //% block="cm"
        Centimeters,
        //% block="inches"
        Inches
    }

    let CHIP_ADDR = 0x42 //address in binary 0100A2 A1 A0(RW) = 0100010
    let OUTPUT_0_REG = 0x02
    let OUTPUT_1_REG = 0x03
    let IO_CONFIG_0 = 0x06
    let IO_CONFIG_1 = 0x07
    let ioInitialised = false
    
    let trafficLight1_Rmask = 0x01
    let trafficLight1_Ymask = 0x02
    let trafficLight1_Gmask = 0x04
    let trafficLight2_Rmask = 0x08
    let trafficLight2_Ymask = 0x10
    let trafficLight2_Gmask = 0x20
    
    let DICE_SYMBOL_1 = 0x08
    let DICE_SYMBOL_2 = 0x14
    let DICE_SYMBOL_3 = 0x1C
    let DICE_SYMBOL_4 = 0x55
    let DICE_SYMBOL_5 = 0x5D
    let DICE_SYMBOL_6 = 0x77
    
    let DICE_NUMBER_0 = [0xC0, 0x77]
    let DICE_NUMBER_1 = [0x00, 0x07]
    let DICE_NUMBER_2 = [0x40, 0x5D]
    let DICE_NUMBER_3 = [0xC0, 0x5F]
    let DICE_NUMBER_4 = [0x00, 0x3F]
    let DICE_NUMBER_5 = [0x40, 0x5F]
    let DICE_NUMBER_6 = [0x80, 0x7E]
    let DICE_NUMBER_7 = [0x40, 0x59]
    let DICE_NUMBER_8 = [0xC0, 0x7F]
    let DICE_NUMBER_9 = [0x40, 0x3F]
    
    let output0Value = 0x00
    let output1Value = 0x00

    let triggerPin = DigitalPin.P13
    let echoPin = DigitalPin.P15
    let unitSelected = Units.Centimeters

    function ioExpanderInit(): void {
        let buf = pins.createBuffer(3)

        buf[0] = IO_CONFIG_0
        buf[1] = 0xFF
        buf[2] = 0xFF
        pins.i2cWriteBuffer(CHIP_ADDR, buf, false)
        basic.pause(1)

        ioInitialised = true //we have setup, so dont come in here again.
    }

    function readOutputPort(): void {
        let writeBuf = pins.createBuffer(1)
        let readBuf = pins.createBuffer(2)
        
        if (ioInitialised == false) {
            ioExpanderInit()
        }
        
        writeBuf[0] = OUTPUT_0_REG
        pins.i2cWriteBuffer(CHIP_ADDR, writeBuf, false)
        //read value of registers
        readBuf = pins.i2cReadBuffer(CHIP_ADDR, 2, false)
        output0Value = readBuf[0]
        output1Value = readBuf[1]
    }

	/**
     * Turns on motor in the direction specified at the requested speed 
	 * @param selectedLight  is the selection of which traffic light will be controlled
	 * @param lightStatus to display the traffic light control
     */
    //% subcategory="Traffic Light"
    //% blockId=kitronik_labbit_traffic_light_status
    //% block="turn traffic light %selectedLight|to %lightStage"
    //% weight=100 blockGap=8
    export function trafficLightStatus(selectedLight: TrafficLight, lightStage: LightStatus): void {
        let writeBuf = pins.createBuffer(3)
        let reg = 0
        let value = 0
        let bitMask = 0
        
        readOutputPort()
        if (selectedLight == TrafficLight.one)
        {
           switch (lightStage) {
                case LightStatus.Stop:
                    bitMask = trafficLight1_Rmask
                    break
                case LightStatus.GetReady:
                    bitMask = trafficLight1_Rmask + trafficLight1_Ymask
                    break
                case LightStatus.Go:
                    bitMask = trafficLight1_Gmask
                    break
                case LightStatus.ReadyToStop:
                    bitMask = trafficLight1_Ymask
                    break
            }
            value = (output0Value && 0xF0) + bitMask
        }
        else if (selectedLight == TrafficLight.two)
        {
           switch (lightStage) {
                case LightStatus.Stop:
                    bitMask = trafficLight2_Rmask
                    break
                case LightStatus.GetReady:
                    bitMask = trafficLight2_Rmask + trafficLight2_Ymask
                    break
                case LightStatus.Go:
                    bitMask = trafficLight2_Gmask
                    break
                case LightStatus.ReadyToStop:
                    bitMask = trafficLight2_Ymask
                    break
            }
            value = (output0Value && 0x0F) + bitMask
        }
        writeBuf[0] = OUTPUT_0_REG
        writeBuf[1] = value
        pins.i2cWriteBuffer(CHIP_ADDR, writeBuf, false)
    }

	/**
     * Turns on motor in the direction specified at the requested speed 
	 * @param selectedLight  is the selection of which traffic light will be controlled
	 * @param lightStatus to display the traffic light control
     */
    //% subcategory="Traffic Light"
    //% blockId=kitronik_labbit_traffic_light_individual
    //% block="turn traffic light %selectedLight| %selectedColour| light %lightOnOff"
    //% weight=100 blockGap=8
    export function trafficLightShow(selectedLight: TrafficLight, selectedColour: LightColour, lightOnOff: LightShow): void {
        let buf = pins.createBuffer(2)
        let value = 0
        let bitMask = 0
        
        readOutputPort()
        if (selectedLight == TrafficLight.one){
            switch (selectedColour) {
                case LightColour.red:
                    if (lightOnOff == LightShow.On){
                        value = output0Value | trafficLight1_Rmask
                    }
                    else if (lightOnOff == LightShow.Off) {
                        value = output0Value ^ trafficLight1_Rmask
                    }
                    break
                case LightColour.yellow:
                    if (lightOnOff == LightShow.On){
                        value = output0Value | trafficLight1_Ymask
                    }
                    else if (lightOnOff == LightShow.Off) {
                        value = output0Value ^ trafficLight1_Ymask
                    }
                    break
                case LightColour.green:
                    if (lightOnOff == LightShow.On){
                        value = output0Value | trafficLight1_Gmask
                    }
                    else if (lightOnOff == LightShow.Off) {
                        value = output0Value ^ trafficLight1_Gmask
                    }
                    break
            }
        }
        else if (selectedLight == TrafficLight.two){
            switch (selectedColour) {
                case LightColour.red:
                    if (lightOnOff == LightShow.On){
                        value = output0Value | trafficLight2_Rmask
                    }
                    else if (lightOnOff == LightShow.Off) {
                        value = output0Value ^ trafficLight2_Rmask
                    }
                    break
                case LightColour.yellow:
                    if (lightOnOff == LightShow.On){
                        value = output0Value | trafficLight2_Ymask
                    }
                    else if (lightOnOff == LightShow.Off) {
                        value = output0Value ^ trafficLight2_Ymask
                    }
                    break
                case LightColour.green:
                    if (lightOnOff == LightShow.On){
                        value = output0Value | trafficLight2_Gmask
                    }
                    else if (lightOnOff == LightShow.Off) {
                        value = output0Value ^ trafficLight2_Gmask
                    }
                    break
            }
        }
        buf[0] = OUTPUT_0_REG
        buf[1] = value
        pins.i2cWriteBuffer(CHIP_ADDR, buf, false)
    }

	/**
     * Will turn off all the dice LED's 
     */
    //% subcategory="Traffic Light"
    //% blockId=kitronik_labbit_traffic_light_off
    //% block="turn off traffic light %selectedLight"
    //% weight=100 blockGap=8
    export function trafficLightOff(selectedLight: TrafficLight): void {
        let buf = pins.createBuffer(2)
        
        readOutputPort()
        buf[0] = OUTPUT_0_REG
        if (selectedLight == TrafficLight.one){
            buf[1] = output0Value & 0xF8
        }
        else if (selectedLight == TrafficLight.two){
            buf[1] = output0Value & 0xC3
        }
        pins.i2cWriteBuffer(CHIP_ADDR, buf, false)
    }

	/**
     * Illuminates the LED on the dice to show the dice 
	 * @param diceRoll  number that shows the dice number on the LED's eg 1
     */
    //% subcategory="Dice"
    //% blockId=kitronik_labbit_dice_roll
    //% block="roll %diceRoll | on dice"
    //% weight=100 blockGap=8
    //% diceRoll.min=1 diceRoll.max=6
    export function diceShow(diceRoll: number): void {
        let buf = pins.createBuffer(2)
        let value = 0
        
        if (ioInitialised == false) {
            ioExpanderInit()
        }
        
        switch (diceRoll) {
            case 1:
                value = DICE_SYMBOL_1
                break
            case 2:
                value = DICE_SYMBOL_2
                break
            case 3:
                value = DICE_SYMBOL_3
                break
            case 4:
                value = DICE_SYMBOL_4
                break
            case 5:
                value = DICE_SYMBOL_5
                break
           case 6:
                value = DICE_SYMBOL_6
                break
        }
        buf[0] = OUTPUT_1_REG
        buf[1] = value
        pins.i2cWriteBuffer(CHIP_ADDR, buf, false)
    }


	/**
     * Illuminates the LED on the dice to show the dice 
	 * @param diceRoll  number that shows the dice number on the LED's eg 1
     */
    //% subcategory="Dice"
    //% blockId=kitronik_labbit_dice_number
    //% block="show %diceNumber | on dice LED's"
    //% weight=100 blockGap=8
    //% diceRoll.min=0 diceRoll.max=9
    export function diceNumber(diceNumber: number): void {
        let buf = pins.createBuffer(3)
        let port0value = 0
        let port1value = 0
        
        readOutputPort()
        
        switch (diceNumber) {
            case 0:
                port0value = DICE_NUMBER_0[0] ^ output0Value
                port1value = DICE_NUMBER_0[1]
                break
            case 1:
                port0value = DICE_NUMBER_1[0] ^ output0Value
                port1value = DICE_NUMBER_1[1]
                break
            case 2:
                port0value = DICE_NUMBER_2[0] ^ output0Value
                port1value = DICE_NUMBER_2[1]
                break
            case 3:
                port0value = DICE_NUMBER_3[0] ^ output0Value
                port1value = DICE_NUMBER_3[1]
                break
            case 4:
                port0value = DICE_NUMBER_4[0] ^ output0Value
                port1value = DICE_NUMBER_4[1]
                break
            case 5:
                port0value = DICE_NUMBER_5[0] ^ output0Value
                port1value = DICE_NUMBER_5[1]
                break
            case 6:
                port0value = DICE_NUMBER_6[0] ^ output0Value
                port1value = DICE_NUMBER_6[1]
                break
            case 7:
                port0value = DICE_NUMBER_7[0] ^ output0Value
                port1value = DICE_NUMBER_7[1]
                break
            case 8:
                port0value = DICE_NUMBER_8[0] ^ output0Value
                port1value = DICE_NUMBER_8[1]
                break
            case 9:
                port0value = DICE_NUMBER_9[0] ^ output0Value
                port1value = DICE_NUMBER_9[1]
                break
            }
        buf[0] = OUTPUT_0_REG
        buf[1] = port0value
        buf[2] = port1value
        pins.i2cWriteBuffer(CHIP_ADDR, buf, false)
    }

	/**
     * Will turn off all the dice LED's 
     */
    //% subcategory="Dice"
    //% blockId=kitronik_labbit_dice_off
    //% block="turn off dice LED's"
    //% weight=100 blockGap=8
    export function diceOff(): void {
        let buf = pins.createBuffer(3)
        
        readOutputPort()
        
        buf[0] = OUTPUT_0_REG
        buf[1] = output0Value & 0x3F
        buf[2] = 0x00
        pins.i2cWriteBuffer(CHIP_ADDR, buf, false)
    }

	/**
     * Turns on motor in the direction specified at the requested speed 
	 * @param dir   which direction to go
	 * @param speed how fast to spin the motor
     */
    //% subcategory="Motor"
    //% blockId=kitronik_labbit_motor_on
    //% block="turn motor |%dir|at speed %speed"
    //% weight=100 blockGap=8
    //% speed.min=0 speed.max=100
    export function motorOn(dir: MotorDirection, speed: number): void {
        /*first convert 0-100 to 0-1024 (approx) We wont worry about the lsat 24 to make life simpler*/
        let OutputVal = Math.clamp(0, 100, speed) * 10;

        switch (dir) {
            case MotorDirection.Forward:
                pins.analogWritePin(AnalogPin.P12, OutputVal);
                pins.digitalWritePin(DigitalPin.P16, 0); /*Write the low side digitally, to allow the 3rd PWM to be used if required elsewhere*/
                break
            case MotorDirection.Reverse:
                pins.analogWritePin(AnalogPin.P12, OutputVal);
                pins.digitalWritePin(DigitalPin.P16, 0);
                break
        }

    }
	/**
     * Turns off the motor
     */
    //% subcategory="Motor"
    //% blockId=kitronik_labbit_motor_off
    //%block="stop motor"
    //% weight=99 blockGap=8
    export function motorOff(): void {
        pins.digitalWritePin(DigitalPin.P12, 0);
        pins.digitalWritePin(DigitalPin.P16, 0);
    }

    /**
     * A string of ZIP LEDs
     */
    export class ZIPString {
        buf: Buffer;
        pin: DigitalPin;
        brightness: number;
        start: number;
        _length: number;
        _mode: ZipLedMode;

        /**
         * Shows a rainbow pattern on all ZIP LEDs.
         */
        //% group="ZIP LEDs"
        //% blockId="kitronik_labbit_zip_rainbow" block="%prettyLights|show rainbow" 
        //% weight=94 blockGap=8
        //% parts="neopixel"
        showRainbow() {
            let startHue: number = 1
            let endHue: number = 360
            if (this._length <= 0) return;

            startHue = startHue >> 0;
            endHue = endHue >> 0;
            const saturation = 100;
            const luminance = 50;
            const steps = this._length;
            const direction = HueInterpolationDirection.Clockwise;

            //hue
            const h1 = startHue;
            const h2 = endHue;
            const hDistCW = ((h2 + 360) - h1) % 360;
            const hStepCW = Math.idiv((hDistCW * 100), steps);
            const hDistCCW = ((h1 + 360) - h2) % 360;
            const hStepCCW = Math.idiv(-(hDistCCW * 100), steps);
            let hStep: number;
            if (direction === HueInterpolationDirection.Clockwise) {
                hStep = hStepCW;
            } else if (direction === HueInterpolationDirection.CounterClockwise) {
                hStep = hStepCCW;
            } else {
                hStep = hDistCW < hDistCCW ? hStepCW : hStepCCW;
            }
            const h1_100 = h1 * 100; //we multiply by 100 so we keep more accurate results while doing interpolation

            //sat
            const s1 = saturation;
            const s2 = saturation;
            const sDist = s2 - s1;
            const sStep = Math.idiv(sDist, steps);
            const s1_100 = s1 * 100;

            //lum
            const l1 = luminance;
            const l2 = luminance;
            const lDist = l2 - l1;
            const lStep = Math.idiv(lDist, steps);
            const l1_100 = l1 * 100

            //interpolate
            if (steps === 1) {
                this.setPixelColor(0, hsl(h1 + hStep, s1 + sStep, l1 + lStep))
            } else {
                this.setPixelColor(0, hsl(startHue, saturation, luminance));
                for (let i = 1; i < steps - 1; i++) {
                    const h = Math.idiv((h1_100 + i * hStep), 100) + 360;
                    const s = Math.idiv((s1_100 + i * sStep), 100);
                    const l = Math.idiv((l1_100 + i * lStep), 100);
                    this.setPixelColor(i, hsl(h, s, l));
                }
                this.setPixelColor(steps - 1, hsl(endHue, saturation, luminance));
            }
            this.show();
        }

        /**
         * Rotate LEDs forward.
         * @param offset number of ZIP LEDs to rotate forward, eg: 1
         */
        //% subcategory="ZIP LED"
        //% blockId="kitronik_labbit_zip_rotate" block="%prettyLights|rotate ZIP LEDs by %offset"
        //% weight=93 blockGap=8
        //% parts="neopixel"
        rotate(offset: number = 1): void {
            const stride = this._mode === ZipLedMode.RGBW ? 4 : 3;
            this.buf.rotate(-offset * stride, this.start * stride, this._length * stride)
            this.show();
        }

        /**
         * Shows all ZIP LEDs display as a given color. 
         * @param rgb RGB color of the LED
         */
        //% subcategory="ZIP LED"
        //% blockId="kitronik_labbit_zip_string_color" block="%prettyLights|show color %rgb=colorNumberPicker2" 
        //% weight=99 blockGap=8
        //% parts="neopixel"
        showColor(rgb: number) {
            rgb = rgb >> 0;
            this.setAllRGB(rgb);
            this.show();
        }

        /**
         * Set particular ZIP LED to a given color. 
         * You need to call ``show changes`` to make the changes visible.
         * @param zipLedNum position of the ZIP LED in the string
         * @param rgb RGB color of the ZIP LED
         */
        //% subcategory="ZIP LED"
        //% blockId="kitronik_labbit_set_zip_color" block="%prettyLights|set ZIP LED %zipLedNum|to %rgb=colorNumberPicker2" 
        //% weight=80 blockGap=8
        //% parts="neopixel"
        setZipLedColor(zipLedNum: number, rgb: number): void {
            this.setPixelRGB(zipLedNum >> 0, rgb >> 0);
        }

        /**
         * Send all the changes to the ZIP LEDs.
         */
        //% subcategory="ZIP LED"
        //% blockId="kitronik_labbit_zip_show" block="%prettyLights|show changes"
        //% weight=96 blockGap=8
        //% parts="neopixel"
        show() {
            //ws2812b.sendBuffer(this.buf, this.pin);
            // Use the pxt-microbit core version which now respects brightness (10/2020)
            light.sendWS2812BufferWithBrightness(this.buf, this.pin, this.brightness);
        }

        /**
         * Turn off all LEDs on the ZIP LED string.
         */
        //% subcategory="ZIP LED"
        //% blockId="kitronik_labbit_zip_clear" block="%prettyLights|turn all ZIP LEDs off"
        //% weight=95 blockGap=8
        //% parts="neopixel"
        clear(): void {
            const stride = this._mode === ZipLedMode.RGBW ? 4 : 3;
            this.buf.fill(0, this.start * stride, this._length * stride);
            this.show();
        }

        /**
         * Set the brightness of the ZIP LEDs. Applies to future changes.
         * @param brightness a measure of LED brightness in 0-255.
         */
        //% subcategory="ZIP LED"
        //% blockId="kitronik_labbit_zip_brightness" block="%prettyLights|set brightness to %brightness"
        //% weight=92 blockGap=8
        //% parts="neopixel"
        setBrightness(brightness: ZipLedBrightness): void {
            this.brightness = brightness & 0xff;
        }

        /**
         * Set the brightness of the ZIP LEDs. Applies to future changes.
         * @param brightnessPercent a measure of LED brightness in 0-255.
         */
        //% subcategory="ZIP LED"
        //% blockId="kitronik_labbit_zip_brightness_2" block="%prettyLights|set brightness to %brightness"
        //% weight=5 blockGap=8
        //% brightnessPercent.min=0 brightnessPercent.max=100
        //% parts="neopixel"
        setBrightnessPercent(brightnessPercent: number): void {
            let brightnessNum = brightnessPercent * 2.55
            this.brightness = brightnessNum & 0xff;
        }

        /**
         * Set the pin where the ZIP LED is connected, defaults to P0.
         */
        //% parts="neopixel"
        setPin(pin: DigitalPin): void {
            this.pin = pin;
            pins.digitalWritePin(this.pin, 0);
            // don't yield to avoid races on initialization
        }

        private setPixelColor(pixeloffset: number, rgb: number): void {
            this.setPixelRGB(pixeloffset, rgb);
        }

        private setBufferRGB(offset: number, red: number, green: number, blue: number): void {
            if (this._mode === ZipLedMode.RGB_RGB) {
                this.buf[offset + 0] = red;
                this.buf[offset + 1] = green;
            } else {
                this.buf[offset + 0] = green;
                this.buf[offset + 1] = red;
            }
            this.buf[offset + 2] = blue;
        }

        private setAllRGB(rgb: number) {
            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            const br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            const end = this.start + this._length;
            const stride = this._mode === ZipLedMode.RGBW ? 4 : 3;
            for (let i = this.start; i < end; ++i) {
                this.setBufferRGB(i * stride, red, green, blue)
            }
        }
        private setAllW(white: number) {
            if (this._mode !== ZipLedMode.RGBW)
                return;

            let br = this.brightness;
            if (br < 255) {
                white = (white * br) >> 8;
            }
            let buf = this.buf;
            let end = this.start + this._length;
            for (let i = this.start; i < end; ++i) {
                let ledoffset = i * 4;
                buf[ledoffset + 3] = white;
            }
        }
        private setPixelRGB(pixeloffset: number, rgb: number): void {
            if (pixeloffset < 0
                || pixeloffset >= this._length)
                return;

            let stride = this._mode === ZipLedMode.RGBW ? 4 : 3;
            pixeloffset = (pixeloffset + this.start) * stride;

            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            let br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            this.setBufferRGB(pixeloffset, red, green, blue)
        }
        private setPixelW(pixeloffset: number, white: number): void {
            if (this._mode !== ZipLedMode.RGBW)
                return;

            if (pixeloffset < 0
                || pixeloffset >= this._length)
                return;

            pixeloffset = (pixeloffset + this.start) * 4;

            let br = this.brightness;
            if (br < 255) {
                white = (white * br) >> 8;
            }
            let buf = this.buf;
            buf[pixeloffset + 3] = white;
        }
    }

    /**
     * Create a new ZIP LED driver for a number of attached ZIP LEDs.
     * @param numleds the number of ZIP LEDs connected to the Klip Motor board, eg: 7
     */
    //% subcategory="ZIP LED"
    //% blockId="kitronik_labbit_zip_create" block="string of %numleds|ZIP LEDs"
    //% weight=100 blockGap=8
    //% parts="neopixel"
    //% trackArgs=0,2
    //% blockSetVariable=prettyLights
    export function createZIPString(numleds: number): ZIPString {
        let prettyLights = new ZIPString();
        let stride = 3;
        prettyLights.buf = pins.createBuffer(numleds * stride);
        prettyLights.start = 0;
        prettyLights._length = numleds;
        prettyLights._mode = 0;
        prettyLights.setBrightness(255)
        prettyLights.setPin(DigitalPin.P8)
        return prettyLights;
    }

    /**
     * Converts red, green, blue channels into a RGB color
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% weight=1
    //% blockId="zip_rgb" block="red %red|green %green|blue %blue"
    //% blockHidden=true
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }

    /**
     * Gets the RGB value of a known color
     * @param color is the list of ZIP LED colours in the drop down box
    */
    //% weight=2 blockGap=8
    //% blockId="zip_colors" block="%color"
    //% blockHidden=true
    export function colors(color: ZipLedColors): number {
        return color;
    }

    /**
     * Get the color wheel field editor
     * @param color color, eg: #ff0000
     */
    //% subcategory="ZIP LED"
    //% blockId=colorNumberPicker2 block="%value"
    //% blockHidden=false
    //% weight=10 blockGap=8
    //% shim=TD_ID colorSecondary="#ffffff"
    //% value.fieldEditor="colornumber" value.fieldOptions.decompileLiterals=true
    //% value.defl='#ff0000'
    //% value.fieldOptions.colours='["#d4ff00","#99ff00","#00ff00","#00ff55","#00ff99","#ffb300","#ffff00","#5eff00","#00ff55","#00ffb3","#ff7700","#ffd500","#ffffff","#00ffff","#00ffcc","#ff3c00", "#ff3399","#ff00ff","#00cdff","#00bbff","#ff0000","#ff0080","#9900ff","#5500ff","#0000ff"]'
    //% value.fieldOptions.columns=5 value.fieldOptions.className='rgbColorPicker'
    export function __colorNumberPicker(value: number) {
        return value;
    }

    function packRGB(a: number, b: number, c: number): number {
        return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF);
    }
    function unpackR(rgb: number): number {
        let r = (rgb >> 16) & 0xFF;
        return r;
    }
    function unpackG(rgb: number): number {
        let g = (rgb >> 8) & 0xFF;
        return g;
    }
    function unpackB(rgb: number): number {
        let b = (rgb) & 0xFF;
        return b;
    }

    /**
     * Converts a hue saturation luminosity value into a RGB color
     */
    function hsl(h: number, s: number, l: number): number {
        h = Math.round(h);
        s = Math.round(s);
        l = Math.round(l);
        
        h = h % 360;
        s = Math.clamp(0, 99, s);
        l = Math.clamp(0, 99, l);
        let c = Math.idiv((((100 - Math.abs(2 * l - 100)) * s) << 8), 10000); //chroma, [0,255]
        let h1 = Math.idiv(h, 60);//[0,6]
        let h2 = Math.idiv((h - h1 * 60) * 256, 60);//[0,255]
        let temp = Math.abs((((h1 % 2) << 8) + h2) - 256);
        let x = (c * (256 - (temp))) >> 8;//[0,255], second largest component of this color
        let r$: number;
        let g$: number;
        let b$: number;
        if (h1 == 0) {
            r$ = c; g$ = x; b$ = 0;
        } else if (h1 == 1) {
            r$ = x; g$ = c; b$ = 0;
        } else if (h1 == 2) {
            r$ = 0; g$ = c; b$ = x;
        } else if (h1 == 3) {
            r$ = 0; g$ = x; b$ = c;
        } else if (h1 == 4) {
            r$ = x; g$ = 0; b$ = c;
        } else if (h1 == 5) {
            r$ = c; g$ = 0; b$ = x;
        }
        let m = Math.idiv((Math.idiv((l * 2 << 8), 100) - c), 2);
        let r = r$ + m;
        let g = g$ + m;
        let b = b$ + m;
        return packRGB(r, g, b);
    }
    
    
    /**
     * Set the distance measurement units to cm or inches (cm is default)
     * @param unit desired conversion unit
     */
    //% subcategory="Inputs"
    //% group="Analog"
    //% blockId=kitronik_labbit_analog_input
    //% block="read analog input value"
    //% weight=100 blockGap=8
    export function readAnalogInput(): number {
        return pins.analogReadPin(AnalogPin.P2)
    }
    
    /**
     * Set the distance measurement units to cm or inches (cm is default)
     * @param unit desired conversion unit
     */
    //% subcategory="Inputs"
    //% group="Ultrasonic"
    //% blockId=kitronik_labbit_ultrasonic_units
    //% block="measure distances in %unit"
    //% weight=100 blockGap=8
    export function setUltrasonicUnits(unit: Units): void {
        unitSelected = unit
    }
    
    /**
     * Measure the echo time (after trigger) and converts to cm or inches and returns as an int
     * @param maxCmDistance maximum distance in centimeters (default is 500)
     */
    //% subcategory="Inputs"
    //% group="Ultrasonic"
    //% blockId=kitronik_labbit_ultrasonic_measure
    //% block="measure distance"
    //% weight=95 blockGap=8
    export function measure(maxCmDistance = 500): number {
        // send pulse
        pins.setPull(triggerPin, PinPullMode.PullNone);
        pins.digitalWritePin(triggerPin, 0);
        control.waitMicros(2);
        pins.digitalWritePin(triggerPin, 1);
        control.waitMicros(10);
        pins.digitalWritePin(triggerPin, 0);

        // read pulse
        const pulse = pins.pulseIn(echoPin, PulseValue.High, maxCmDistance * 39);
        //From the HC-SR04 datasheet the formula for calculating distance is "microSecs of pulse"/58 for cm or "microSecs of pulse"/148 for inches.
        //When measured actual distance compared to calculated distanceis not the same.  There must be an timing measurement with the pulse.
        //values have been changed to match the correct measured distances so 58 changed to 39 and 148 changed to 98
        switch (unitSelected) {
            case Units.Centimeters: return Math.idiv(pulse, 39);
            case Units.Inches: return Math.idiv(pulse, 98);
            default: return 0;
        }
    }
    
}
