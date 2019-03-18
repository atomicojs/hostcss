const REG_NEST = /(&|@)([^{}]+)({([^{}]*)})/g;
/**
 *
 * @param {*} host
 * @param {*} css
 */
export function parse(host, css) {
    let rules = [],
        imps = [],
        memo = {},
        ID = 0;
    /**
     * capture nested rules for later
     * unite them without nesting
     * @param {string} css
     */
    function nesting(css) {
        let nextCss = css.replace(REG_NEST, (all, type, selector, content) => {
            let index = ID++;
            memo[index] = [type, selector, content];
            return "@" + index;
        });
        if (nextCss !== css);
        return nextCss != css ? nesting(nextCss) : nextCss;
    }
    /**
     * @param {string} host  - concurrent parent selector of nesting
     * @param {string} css - remaining CSS string
     * @param {array} rules  - list of rules
     */
    function join(host, css, rules = []) {
        return css.replace(/@(\d+)/g, (all, id) => {
            let [type, selector, content] = memo[id];
            if (type == "&") {
                selector = host + selector;
                rules.unshift(selector + join(selector, content, rules));
            }
            if (type == "@" && /^media/.test(selector)) {
                let subRules = [];
                subRules.unshift(host + join(host, content, subRules));
                rules.push(`@${selector}{${subRules.join("")}}`);
            }
            return "";
        });
    }
    /**
     * Clean the used imports within the CSS, before defining the rules
     */
    css = css.replace(/@import url\([^()]+\)(;){0,1}/g, all => {
        imps.push(all);
        return "";
    });
    let scope = join(host, nesting(css), rules).trim();
    if (scope) rules.unshift(`${host}{${scope}}`);
    return imps.concat(rules);
}
