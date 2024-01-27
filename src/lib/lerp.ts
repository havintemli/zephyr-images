export function getLerp(
  colors: number[],
  index: number,
  offset: number
): string {
  if (colors.length === 1) {
    return `${colors[index]} * ld(0)`;
  } else if (colors.length === 2) {
    return `if(between(X,0,${offset}), ${colors[0]} * ld(0), if(between(X, ${
      770 - offset
    }, 770), ${colors[colors.length - 1]} * ld(0), lerp(${
      colors[index]
    } * ld(0), ${colors[index + 1] || 0} * ld(0), (X-${offset})/(W-${
      offset * 2
    }))))`;
  }

  const step = Math.ceil((770 - offset * 2) / (colors.length - 1));

  let wrapper = "%r";

  if (index === 0) {
    wrapper = `if(between(X, 0, ${offset}), ${
      colors[0]
    } * ld(0), if(between(X, ${770 - offset}, 770), ${
      colors[colors.length - 1]
    } * ld(0), %r))`;
  }

  const equation = `if(between(X,${offset + step * index},${
    offset + (step * (index + 1) - 1)
  }), lerp(${colors[index]} * ld(0),${
    colors[index + 1] || 0
  } * ld(0),mod(X-${offset},${step})/${step}),${
    colors[index + 1] === undefined ? 0 : getLerp(colors, index + 1, offset)
  })`;

  return wrapper.replace("%r", equation);
}
