function vlookupTrue(table, key, value) {
    let best = null;
    for (const row of table) {
        const k = row[key];
        if (k <= value) {
            if (best === null || k > best[key]) best = row;
        }
    }
    return best !== null ? best : table[0];
}

function getPaxIndex(count, zone) {
    const zoneMap = { S: 'S', P: 'P', L: 'L', O: 'O', M: 'M' };
    const z = zoneMap[zone] || 'S';
    const c = Math.max(0, Math.min(count, 16));
    const entry = BBJ_DATA.paxIndex[c];
    return entry ? (entry[z] || 0) : 0;
}

function auxTankHasFuel(kg) {
    const rule = (typeof BBJ_DATA !== 'undefined' && BBJ_DATA.fuelRules) ? BBJ_DATA.fuelRules : { auxThreshold: 20600 };
    return kg > rule.auxThreshold;
}

function getFuelIndex(kg) {
    if (kg <= 0) return 0;
    return vlookupTrue(BBJ_DATA.fuelIndex, 'kg', kg).idx;
}

function getWaterData(usGal) {
    const row = vlookupTrue(BBJ_DATA.waterTable, 'usg', -usGal);
    return { kg: row.kg, idx: row.idx };
}

function getGalleyIndex(kg, zoneCol) {
    if (kg <= 0) return 0;
    return vlookupTrue(BBJ_DATA.galleyIndex, 'wt', kg)[zoneCol];
}

function getGalleyIndexInterp(kg, zoneCol) {
    if (kg <= 0) return 0;
    const t = BBJ_DATA.galleyIndex.slice().sort(function(a, b) { return a.wt - b.wt; });
    let prev = t[0], next = null;
    for (const row of t) {
        if (row.wt <= kg) prev = row;
        else { next = row; break; }
    }
    if (!next) return prev[zoneCol];
    if (next.wt === prev.wt) return prev[zoneCol];
    const f = (kg - prev.wt) / (next.wt - prev.wt);
    return prev[zoneCol] + f * (next[zoneCol] - prev[zoneCol]);
}

function calculate(inputs) {
    const isVip = inputs.vip === 'YES';

    const cabinCrew = parseInt(inputs.cabincrew) || 0;
    const staff = parseInt(inputs.staff) || 0;
    const extraCC = parseInt(inputs.extracc) || 0;
    const premium = parseInt(inputs.premium) || 0;
    const vipLounge = parseInt(inputs.vipLounge) || 0;
    const vipOffice = parseInt(inputs.vipOffice) || 0;
    const vipSuite = parseInt(inputs.vipSuite) || 0;

    const blockFuel = parseFloat(inputs.blockFuel) || 0;
    const taxiFuel = parseFloat(inputs.taxiFuel) || 0;
    const tripFuel = parseFloat(inputs.tripFuel) || 0;
    const fwdHold = parseFloat(inputs.fwdHold) || 0;
    const aftHold = parseFloat(inputs.aftHold) || 0;
    const waterGal = parseFloat(inputs.water) || 0;
    const fwdGalley = parseFloat(inputs.fwdGalley) || 0;
    const midGalley = parseFloat(inputs.midGalley) || 0;
    const zoneBOtherLoad = parseFloat(inputs.zoneBOtherLoad) || 0;

    const obsWt = (parseInt(inputs.observers) || 0) * BBJ_DATA.crew.observer.wt;
    const obsIdx = (parseInt(inputs.observers) || 0) * BBJ_DATA.crew.observer.idx;

const totalZoneB = staff + extraCC;
        const zoneBWeightCount = (inputs.correctedDow != null) ? staff : totalZoneB;
        const totalPax = totalZoneB + premium + vipLounge + vipOffice + vipSuite;

    let dow, doi;
    if (inputs.correctedDow != null && inputs.correctedDoi != null) {
        dow = inputs.correctedDow;
        doi = inputs.correctedDoi;
    } else if (isVip) {
        dow = BBJ_DATA.doiVip;
        doi = BBJ_DATA.doiVipIndex;
    } else {
        const faWt = cabinCrew * BBJ_DATA.crew.fa.wt;
        const faIdx = getPaxIndex(cabinCrew, 'S');
        const waterData = getWaterData(waterGal);
        const fwdGalleyIdx = getGalleyIndex(fwdGalley, 'A');
        const midGalleyIdx = getGalleyIndex(midGalley, 'C');
        dow = BBJ_DATA.doiBasic + 164 + faWt + waterData.kg + fwdGalley + midGalley;
        doi = BBJ_DATA.doiBasicIndex + (-3) + faIdx + waterData.idx + fwdGalleyIdx + midGalleyIdx;
    }

    const paxCount = zoneBWeightCount + premium + vipLounge + vipOffice + vipSuite;
    const paxBagWt = Math.round(paxCount * BBJ_DATA.paxWeight);
    const paxIdx = getPaxIndex(totalZoneB, 'S')
        + getPaxIndex(premium, 'P')
        + getPaxIndex(vipLounge, 'L')
        + getPaxIndex(vipOffice, 'O')
        + getPaxIndex(vipSuite, 'M');

    const cargoWt = fwdHold + aftHold;
    const fwdHoldIdx = vlookupTrue(BBJ_DATA.cargoIndex.FWD, 'wt', fwdHold).idx;
    const aftHoldIdx = vlookupTrue(BBJ_DATA.cargoIndex.AFT, 'wt', aftHold).idx;
    const cargoIdx = fwdHoldIdx + aftHoldIdx;

    const otherLoadIdx = getGalleyIndex(zoneBOtherLoad, 'A');

    let zoneWt = 0;
    let zoneIdx = 0;
    const zoneKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    if (inputs.zoneLoad && typeof inputs.zoneLoad === 'object') {
        for (const z of zoneKeys) {
            const kg = parseFloat(inputs.zoneLoad[z]) || 0;
            if (kg > 0) {
                zoneWt += kg;
                zoneIdx += getGalleyIndexInterp(kg, z);
            }
        }
    }

    const zfw = dow + paxBagWt + obsWt + zoneBOtherLoad + cargoWt + zoneWt;
    const zfwIdx = doi + paxIdx + obsIdx + otherLoadIdx + cargoIdx + zoneIdx;

    const rampWt = zfw + blockFuel;
    const rampIdx = zfwIdx + getFuelIndex(blockFuel);

    const toFuel = blockFuel - taxiFuel;
    const toFuelIdx = getFuelIndex(toFuel);

    const tow = rampWt - taxiFuel;
    const towIdx = zfwIdx + toFuelIdx;

    const law = tow - tripFuel;
    const ldFuel = toFuel - tripFuel;
    const ldFuelIdx = getFuelIndex(ldFuel);
    const lawIdx = zfwIdx + ldFuelIdx;

    const underload = BBJ_DATA.limits.MTOW - tow;

    let lmcWt = 0;
    let lmcIdx = 0;
    const lmcInputs = document.querySelectorAll('.lmc-input');
    if (lmcInputs.length >= 5) {
        lmcWt = parseFloat(lmcInputs[3].value) || 0;
        lmcIdx = parseFloat(lmcInputs[4].value) || 0;
    }

    const underloadAfterLMC = underload - lmcWt;

    function indexToMac(index, weight) {
        if (!weight || weight <= 0) return 0;
        const mac = (((500 * index - 32500) / weight + 0.804) * 100) / 3.682;
        return Math.round(mac * 100) / 100;
    }

    const zfwMac = indexToMac(zfwIdx, zfw);
    const towMac = indexToMac(towIdx, tow);
    const lawMac = indexToMac(lawIdx, law);

    const fuelValid = blockFuel <= BBJ_DATA.limits.maxFuel && taxiFuel <= blockFuel && tripFuel <= toFuel;

    return {
        dow: Math.round(dow),
        doi: round2(doi),
        paxBagWt: Math.round(paxBagWt),
        paxIdx: round2(paxIdx),
        obsWt: Math.round(obsWt),
        obsIdx: round2(obsIdx),
        zoneBOtherLoad: zoneBOtherLoad,
        cargoWt: Math.round(cargoWt),
        cargoIdx: round2(cargoIdx),
        zoneWt: Math.round(zoneWt),
        zoneIdx: round2(zoneIdx),
        fwdHold: fwdHold,
        aftHold: aftHold,
        zfw: Math.round(zfw),
        zfwIdx: round2(zfwIdx),
        zfwMac: zfwMac,
        mzfw: BBJ_DATA.limits.MZFW,
        rampWt: Math.round(rampWt),
        rampIdx: round2(rampIdx),
        mrw: BBJ_DATA.limits.MRW,
        blockFuel: Math.round(blockFuel),
        blockFuelIdx: round2(getFuelIndex(blockFuel)),
        maxFuel: BBJ_DATA.limits.maxFuel,
        taxiFuel: Math.round(taxiFuel),
        toFuel: Math.round(toFuel),
        toFuelIdx: round2(toFuelIdx),
        tow: Math.round(tow),
        towIdx: round2(towIdx),
        towMac: towMac,
        mtow: BBJ_DATA.limits.MTOW,
        tripFuel: Math.round(tripFuel),
        ldFuel: Math.round(ldFuel),
        ldFuelIdx: round2(ldFuelIdx),
        law: Math.round(law),
        lawIdx: round2(lawIdx),
        lawMac: lawMac,
        mlw: BBJ_DATA.limits.MLW,
        underload: Math.round(underload),
        underloadMlw: BBJ_DATA.limits.MLW - law,
        underloadMzfw: BBJ_DATA.limits.MZFW - zfw,
        underloadAfterLMC: Math.round(underloadAfterLMC),
        lmcWt: Math.round(lmcWt),
        lmcIdx: round2(lmcIdx),
        checks: {
            zfw: zfw <= BBJ_DATA.limits.MZFW,
            tow: tow <= BBJ_DATA.limits.MTOW,
            law: law <= BBJ_DATA.limits.MLW,
            ramp: rampWt <= BBJ_DATA.limits.MRW,
            fuel: fuelValid,
            fuelError: taxiFuel > blockFuel ? 'Taxi Fuel > Block Fuel' : (tripFuel > toFuel ? 'Trip Fuel > T/O Fuel' : ''),
            fwdCargo: fwdHold <= 2948,
            aftCargo: aftHold <= 1588
        },
        totalZoneB: totalZoneB,
        totalPax: totalPax
    };
}

function indexToMac(index, weight) {
    if (!weight || weight <= 0) return 0;
    const mac = (((500 * index - 32500) / weight + 0.804) * 100) / 3.682;
    return Math.round(mac * 100) / 100;
}

function round2(n) {
    return Math.round(n * 100) / 100;
}