import React, { PropTypes, Component } from 'react';
import { View, Animated, Easing, PanResponder } from 'react-native'
import { styles, radius } from './styles.js';

export default class Ripple extends Component {
  static defaultProps = {
    rippleColor: 'black',
    rippleOpacity: 0.20,
    rippleDuration: 400,
    rippleSize: 0,
    rippleContainerBorderRadius: 0,
    disabled: false,
  };

  static propTypes = {
    rippleColor: PropTypes.string,
    rippleOpacity: PropTypes.number,
    rippleDuration: PropTypes.number,
    rippleSize: PropTypes.number,
    rippleContainerBorderRadius: PropTypes.number,
    disabled: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.onLayout = this.onLayout.bind(this);

    this.unique = 0;
    this.focused = false;

    this.state = {
      size: 0,
      width: 0,
      height: 0,
      ripples: [],
    };
  }

  componentWillMount() {
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => !this.props.disabled,
      onMoveShouldSetPanResponder: () => !this.props.disabled,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (event, gestureState) => {
        this.setFocused(true);
      },

      onPanResponderMove: (event, gestureState) => {
        let { locationX, locationY } = event.nativeEvent;
        let { width, height } = this.state;

        let focused =
          (locationX >= 0 && locationX <= width) &&
          (locationY >= 0 && locationY <= height);

        this.setFocused(focused);
      },

      onPanResponderRelease: (event, gestureState) => {
        let { onPress, disabled } = this.props;

        if (this.focused && !disabled) {
          this.startRipple(event);

          if (typeof onPress === 'function') {
            onPress();
          }
        }

        this.setFocused(false);
      },

      onPanResponderTerminate: (event, gestureState) => {
        this.setFocused(false);
      },
    });
  }

  setFocused(focused) {
    if (focused ^ this.focused) {
      this.onFocusChange(this.focused = focused);
    }
  }

  onFocusChange(focused) {
    let { onPressOut, onPressIn } = this.props;

    if (focused) {
      if (typeof onPressIn === 'function') {
        onPressIn();
      }
    } else {
      if (typeof onPressOut === 'function') {
        onPressOut();
      }
    }
  }

  onLayout(event) {
    let { rippleSize } = this.props;
    let { width, height } = event.nativeEvent.layout;

    let size = rippleSize > 0?
      rippleSize : Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));

    this.setState({ size, width, height });
  }

  startRipple(event) {
    let { locationX, locationY } = event.nativeEvent;
    let { rippleDuration, rippleOpacity } = this.props;
    let { ripples, size } = this.state;

    let unique = this.unique++;

    let ripple = {
      scale: new Animated.Value(1 / (radius * 2)),
      opacity: new Animated.Value(rippleOpacity),

      unique, locationX, locationY,
    };

    ripples.push(ripple);

    Animated
      .parallel([
        Animated.timing(ripple.scale, {
          toValue: size / (radius * 2),
          duration: rippleDuration,
          easing: Easing.out(Easing.ease),
        }),

        Animated.timing(ripple.opacity, {
          toValue: 0,
          duration: rippleDuration,
          easing: Easing.out(Easing.ease),
        }),
      ])
      .start(() => {
        let ripples = this.state.ripples.slice(1);

        this.setState({ ripples });
      });

    this.setState({ ripples });
  }

  render() {
    let { children, rippleColor, rippleContainerBorderRadius, ...props } = this.props;
    let { ripples } = this.state;

    let containerStyle = {
      borderRadius: rippleContainerBorderRadius,
    };

    ripples = ripples
      .map(({ scale, opacity, locationX, locationY, unique }) => {
        let rippleStyle = {
          top: locationY - radius,
          left: locationX - radius,
          backgroundColor: rippleColor,

          transform: [{ scale }],
          opacity,
        };

        return (
          <Animated.View style={[ styles.ripple, rippleStyle ]} key={unique} pointerEvents='none' />
        );
      });

    return (
      <Animated.View onLayout={this.onLayout} {...props} {...this.panResponder.panHandlers}>
        {children}

        <View style={[ styles.container, containerStyle ]} pointerEvents='none'>
          {ripples}
        </View>
      </Animated.View>
    );
  }
}
